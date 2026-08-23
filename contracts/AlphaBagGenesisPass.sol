// SPDX-License-Identifier: MIT
// PATCH: AlphaBagGenesisPass.sol — Hardened production version
// Fixes:
//   1. Added EIP-2981 supportsInterface (EIP-2981 discovery by marketplaces)
//   2. Added zero-address guards on all critical setters
//   3. Added Pausable (emergency stop for mint/transfer)
//   4. Added ERC721Enumerable for marketplace compatibility
//   5. Fixed _checkOnERC721Received operator param compliance
//   6. Added explicit MAX_MINT_PER_WALLET enforcement
//   7. Added ReentrancyGuard on mintWithBag
//   8. Added event for treasury address changes

pragma solidity ^0.8.20;

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Enumerable {
    function totalSupply() external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
}

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IBEP20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract AlphaBagGenesisPass is IERC721, IERC721Metadata, IERC721Enumerable, IERC2981, IERC165 {
    string public name = "AlphaBAG Genesis Pass";
    string public symbol = "ABGP";
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_MINT_PER_WALLET = 10;
    uint256 public mintPriceBag = 100 * 10**18; // 100 BAG tokens
    uint256 public constant MAX_ROYALTY_BPS = 1000; // 10% max
    uint256 public royaltyBps = 500; // 5% default

    address public owner;
    address public treasuryAddress;
    address public bagToken;

    bool public mintActive = false;
    bool public revealed = false;
    bool public paused = false;
    string public hiddenMetadataUri;
    string public baseTokenURI;

    uint256 private _totalMinted;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(address => uint256) public walletMintCount;

    // Enumerable tracking
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;
    uint256[] private _allTokens;
    mapping(uint256 => uint256) private _allTokensIndex;

    // Reentrancy guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    event TreasuryAddressUpdated(address indexed oldTreasury, address indexed newTreasury);
    event BagTokenUpdated(address indexed oldToken, address indexed newToken);
    event Paused(address account);
    event Unpaused(address account);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event RoyaltyUpdated(uint256 oldBps, uint256 newBps);

    constructor(
        address _treasury,
        address _bagToken,
        string memory _hiddenUri
    ) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        require(_bagToken != address(0), "BAG token cannot be zero address");
        owner = msg.sender;
        treasuryAddress = _treasury;
        bagToken = _bagToken;
        hiddenMetadataUri = _hiddenUri;
        _status = _NOT_ENTERED;
    }

    // ── IERC165 ──────────────────────────────────────────────────────────────
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC721Enumerable).interfaceId ||
            interfaceId == type(IERC2981).interfaceId;
    }

    // ── IERC721 ──────────────────────────────────────────────────────────────
    function balanceOf(address _owner) public view override returns (uint256) {
        require(_owner != address(0), "Invalid address");
        return _balances[_owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function approve(address to, uint256 tokenId) public override {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address _owner, address operator) public view override returns (bool) {
        return _operatorApprovals[_owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override whenNotPaused {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override whenNotPaused {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public whenNotPaused {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver");
    }

    // ── IERC721Metadata ────────────────────────────────────────────────────────
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        if (!revealed) {
            return hiddenMetadataUri;
        }
        return string(abi.encodePacked(baseTokenURI, _uint2str(tokenId), ".json"));
    }

    // ── IERC721Enumerable ────────────────────────────────────────────────────
    function totalSupply() public view override returns (uint256) {
        return _totalMinted;
    }

    function tokenOfOwnerByIndex(address _owner, uint256 index) public view override returns (uint256) {
        require(index < balanceOf(_owner), "Owner index out of bounds");
        return _ownedTokens[_owner][index];
    }

    function tokenByIndex(uint256 index) public view override returns (uint256) {
        require(index < totalSupply(), "Global index out of bounds");
        return _allTokens[index];
    }

    // ── IERC2981 ─────────────────────────────────────────────────────────────
    function royaltyInfo(uint256 /*tokenId*/, uint256 salePrice) public view override returns (address receiver, uint256 royaltyAmount) {
        return (treasuryAddress, (salePrice * royaltyBps) / 10000);
    }

    // ── Minting ──────────────────────────────────────────────────────────────
    function mintWithBag(uint256 quantity) public nonReentrant whenNotPaused {
        require(mintActive, "Minting is not active");
        require(quantity > 0 && quantity <= 10, "Invalid quantity (1-10)");
        require(_totalMinted + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(walletMintCount[msg.sender] + quantity <= MAX_MINT_PER_WALLET, "Exceeds wallet mint limit");

        uint256 totalCost = mintPriceBag * quantity;
        require(IBEP20(bagToken).transferFrom(msg.sender, treasuryAddress, totalCost), "BAG transfer failed");

        for (uint256 i = 0; i < quantity; i++) {
            _totalMinted++;
            uint256 newTokenId = _totalMinted;
            _mint(msg.sender, newTokenId);
        }

        walletMintCount[msg.sender] += quantity;
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Mint to zero address");
        require(_owners[tokenId] == address(0), "Token already minted");

        _balances[to] += 1;
        _owners[tokenId] = to;

        // Enumerable tracking
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);

        emit Transfer(address(0), to, tokenId);
    }

    // ── Internal Transfer ────────────────────────────────────────────────────
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Not token owner");
        require(to != address(0), "Transfer to zero address");

        _approve(address(0), tokenId);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        // Enumerable: remove from old owner
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }
        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];

        // Enumerable: add to new owner
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);

        emit Transfer(from, to, tokenId);
    }

    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || getApproved(tokenId) == spender || isApprovedForAll(tokenOwner, spender));
    }

    // ── ERC721Receiver Check ─────────────────────────────────────────────────
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) internal returns (bool) {
        if (to.code.length == 0) {
            return true;
        }
        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
        } catch {
            return false;
        }
    }

    // ── Admin Functions ────────────────────────────────────────────────────────
    function setMintActive(bool _active) public onlyOwner {
        mintActive = _active;
    }

    function setRevealed(bool _revealed) public onlyOwner {
        revealed = _revealed;
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        baseTokenURI = _uri;
    }

    function setHiddenMetadataUri(string memory _uri) public onlyOwner {
        hiddenMetadataUri = _uri;
    }

    function setMintPriceBag(uint256 _price) public onlyOwner {
        require(_price > 0, "Price must be > 0");
        uint256 oldPrice = mintPriceBag;
        mintPriceBag = _price;
        emit MintPriceUpdated(oldPrice, _price);
    }

    function setTreasuryAddress(address _treasury) public onlyOwner {
        require(_treasury != address(0), "Treasury cannot be zero address");
        address oldTreasury = treasuryAddress;
        treasuryAddress = _treasury;
        emit TreasuryAddressUpdated(oldTreasury, _treasury);
    }

    function setBagToken(address _bagToken) public onlyOwner {
        require(_bagToken != address(0), "BAG token cannot be zero address");
        address oldToken = bagToken;
        bagToken = _bagToken;
        emit BagTokenUpdated(oldToken, _bagToken);
    }

    function setRoyaltyBps(uint256 _bps) public onlyOwner {
        require(_bps <= MAX_ROYALTY_BPS, "Royalty cannot exceed 10%");
        uint256 oldBps = royaltyBps;
        royaltyBps = _bps;
        emit RoyaltyUpdated(oldBps, _bps);
    }

    // ── Pausable ───────────────────────────────────────────────────────────────
    function pause() public onlyOwner {
        require(!paused, "Already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() public onlyOwner {
        require(paused, "Not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ── Ownership Transfer ───────────────────────────────────────────────────
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}
