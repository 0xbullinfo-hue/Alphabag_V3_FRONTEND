// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AlphaBAG Genesis Utility Pass (ERC-721A)
 * @notice 10,000 Limited Genesis Utility Passes on Binance Smart Chain.
 * @dev Gas-optimized batch minting using ERC-721A, payable in $BAG BEP-20 tokens.
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);
}

abstract contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is 0 address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract AlphaBagGenesisPass is Ownable, ReentrancyGuard, IERC2981 {
    // Collection Constants
    string public constant name = "AlphaBAG Genesis Pass";
    string public constant symbol = "ALPHAPASS";
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_MINT_PER_TX = 10;   // max per single transaction
    uint256 public constant MAX_MINT_PER_WALLET = 10; // hard cap per wallet address

    // Mint Parameters
    IERC20 public bagToken;
    address public treasuryAddress;
    uint256 public mintPriceBag = 100 * 10**18; // 100 $BAG (18 decimals)
    bool public isMintActive = false;

    // Metadata
    string public baseURI;
    string public hiddenMetadataURI;
    bool public isRevealed = false;

    // Royalty (EIP-2981) - Default 5% (500 / 10000)
    address public royaltyReceiver;
    uint96 public royaltyFeeBps = 500;

    // Internal ERC-721A Tracking
    uint256 private _currentIndex = 1;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(address => uint256) private _walletMinted; // tracks total minted per wallet

    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event Minted(address indexed minter, uint256 quantity, uint256 startTokenId, uint256 totalBagPaid);

    constructor(
        address _bagTokenAddress,
        address _treasuryAddress,
        string memory _initialHiddenURI
    ) Ownable(msg.sender) {
        bagToken = IERC20(_bagTokenAddress);
        treasuryAddress = _treasuryAddress;
        royaltyReceiver = _treasuryAddress;
        hiddenMetadataURI = _initialHiddenURI;
    }

    // ============================================================
    // MINT ENGINE
    // ============================================================

    /**
     * @notice Mint Alpha Passes using $BAG Tokens
     * @param quantity Number of passes to mint (1 - 10 per wallet total)
     */
    function mintWithBag(uint256 quantity) external nonReentrant {
        require(isMintActive, "Mint is not active");
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "Invalid mint quantity");
        require(_walletMinted[msg.sender] + quantity <= MAX_MINT_PER_WALLET, "Exceeds max 10 mints per wallet");
        require(_currentIndex + quantity - 1 <= MAX_SUPPLY, "Max supply exceeded");

        uint256 totalBagCost = mintPriceBag * quantity;
        require(bagToken.balanceOf(msg.sender) >= totalBagCost, "Insufficient $BAG balance");

        // Transfer $BAG directly to Protocol Treasury
        bool success = bagToken.transferFrom(msg.sender, treasuryAddress, totalBagCost);
        require(success, "$BAG token payment transfer failed");

        uint256 startTokenId = _currentIndex;
        _balances[msg.sender] += quantity;
        _walletMinted[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 currentId = startTokenId + i;
            _owners[currentId] = msg.sender;
            emit Transfer(address(0), msg.sender, currentId);
        }

        _currentIndex += quantity;

        emit Minted(msg.sender, quantity, startTokenId, totalBagCost);
    }

    /**
     * @notice Returns how many passes a wallet has minted so far
     */
    function walletMintCount(address wallet) external view returns (uint256) {
        return _walletMinted[wallet];
    }

    /**
     * @notice Owner reserve mint (for giveaways / team / liquidity seeds)
     */
    function airdropPasses(address recipient, uint256 quantity) external onlyOwner {
        require(_currentIndex + quantity - 1 <= MAX_SUPPLY, "Max supply exceeded");

        uint256 startTokenId = _currentIndex;
        _balances[recipient] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 currentId = startTokenId + i;
            _owners[currentId] = recipient;
            emit Transfer(address(0), recipient, currentId);
        }

        _currentIndex += quantity;
    }

    // ============================================================
    // METADATA & TOKEN URI
    // ============================================================

    function totalSupply() public view returns (uint256) {
        return _currentIndex - 1;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");

        if (!isRevealed) {
            return hiddenMetadataURI;
        }

        return string(abi.encodePacked(baseURI, _toString(tokenId), ".json"));
    }

    // ============================================================
    // ERC-721 VIEWS & TRANSFERS
    // ============================================================

    function balanceOf(address owner_) public view returns (uint256) {
        require(owner_ != address(0), "Address is zero");
        return _balances[owner_];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner_ = _owners[tokenId];
        require(owner_ != address(0), "Nonexistent token");
        return owner_;
    }

    function approve(address to, uint256 tokenId) public {
        address owner_ = ownerOf(tokenId);
        require(to != owner_, "Approval to current owner");
        require(msg.sender == owner_ || isApprovedForAll(owner_, msg.sender), "Not authorized");

        _tokenApprovals[tokenId] = to;
        emit Approval(owner_, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner_, address operator) public view returns (bool) {
        return _operatorApprovals[owner_][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved");
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Transfer to non ERC721Receiver");
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to zero address");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _currentIndex && _owners[tokenId] != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner_ = ownerOf(tokenId);
        return (spender == owner_ || isApprovedForAll(owner_, spender) || getApproved(tokenId) == spender);
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch {
                return false;
            }
        }
        return true;
    }

    // ============================================================
    // ROYALTIES (EIP-2981)
    // ============================================================

    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * royaltyFeeBps) / 10000;
        return (royaltyReceiver, royaltyAmount);
    }

    // ============================================================
    // ADMIN SETTERS
    // ============================================================

    function setMintActive(bool _active) external onlyOwner {
        isMintActive = _active;
    }

    function setMintPriceBag(uint256 _priceBag) external onlyOwner {
        mintPriceBag = _priceBag;
    }

    function setBagToken(address _bagToken) external onlyOwner {
        bagToken = IERC20(_bagToken);
    }

    function setTreasuryAddress(address _treasury) external onlyOwner {
        treasuryAddress = _treasury;
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function setHiddenMetadataURI(string memory _hiddenURI) external onlyOwner {
        hiddenMetadataURI = _hiddenURI;
    }

    function setRevealed(bool _revealed) external onlyOwner {
        isRevealed = _revealed;
    }

    function setRoyalty(address _receiver, uint96 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Royalty cannot exceed 10%");
        royaltyReceiver = _receiver;
        royaltyFeeBps = _feeBps;
    }

    // Helper
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
