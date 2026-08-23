# AlphaBAG Genesis Pass (10,000 NFT Collection) — Deployment & Setup Guide

## 📦 What Was Generated

1. **Smart Contract**: [`AlphaBagGenesisPass.sol`](file:///c:/Users/1/repos/Alphabag_V3_FRONTEND/contracts/AlphaBagGenesisPass.sol)
   - **Standard**: Gas-optimized ERC-721A with EIP-2981 Royalties.
   - **Payment Currency**: 100 $BAG (BEP-20) transferred directly to Protocol Treasury.
   - **Max Supply**: 10,000 Passes (Max 10 per wallet / Max 10 per tx).
   - **Security**: `ReentrancyGuard`, `Ownable`, standard checks.

2. **10,000 Metadata JSON Files**: Located in [`public/nft-collection/metadata/`](file:///c:/Users/1/repos/Alphabag_V3_FRONTEND/public/nft-collection/metadata)
   - Individual files: `1.json`, `2.json`, ... `10000.json`.
   - Master Catalog: `_metadata.json`.
   - Rarity Distribution: `rarity-distribution.json`.

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Upload Images & Metadata to IPFS

1. Put your 10,000 NFT image files (`1.png` through `10000.png`) in a folder named `images` and upload to [Pinata](https://pinata.cloud) or [NFT.Storage](https://nft.storage).
   - You will get an Images CID, e.g.: `ipfs://QmImagesCIDHere`
2. Update the `IPFS_IMAGE_BASE_URI` in `scripts/generate-nft-collection.js` with your CID and re-run:
   ```bash
   node scripts/generate-nft-collection.js
   ```
3. Upload the resulting `metadata` folder (`public/nft-collection/metadata`) to Pinata.
   - You will get a Metadata CID, e.g.: `ipfs://QmMetadataCIDHere/`

---

### Step 2: Deploy Contract via Remix IDE or Hardhat

1. Open [Remix IDE](https://remix.ethereum.org).
2. Create a new file `AlphaBagGenesisPass.sol` and paste the contents from [`contracts/AlphaBagGenesisPass.sol`](file:///c:/Users/1/repos/Alphabag_V3_FRONTEND/contracts/AlphaBagGenesisPass.sol).
3. In compiler settings, select Solidity version `0.8.20`.
4. Under the Deploy tab:
   - Environment: **Injected Provider - MetaMask** (Connected to BSC Mainnet: Chain ID `56`, or BSC Testnet: Chain ID `97`).
   - Constructor Arguments:
     - `_bagTokenAddress`: Your $BAG BEP-20 token address (e.g. `0x...`)
     - `_treasuryAddress`: Your Protocol Treasury wallet to receive the $BAG proceeds.
     - `_initialHiddenURI`: Pre-reveal placeholder URI (or `ipfs://QmMetadataCIDHere/1.json`).
5. Click **Deploy** and confirm transaction in your wallet.

---

### Step 3: Configure Post-Deployment Settings

Once deployed, call the following functions from the contract owner wallet:

1. `setBaseURI("ipfs://QmMetadataCIDHere/")` — sets the base metadata URI.
2. `setRevealed(true)` — reveals the 10,000 NFTs on Element Market & OpenSea.
3. `setMintActive(true)` — enables public minting with 100 $BAG.

---

### Step 4: Link Contract to Frontend

Add your deployed contract address to your `.env` in `Alphabag_V3_FRONTEND`:

```env
VITE_NFT_CONTRACT_ADDRESS_MAINNET=0xYourDeployedContractAddressHere
VITE_NFT_CONTRACT_ADDRESS_TESTNET=0xYourDeployedContractAddressHere
```

Your frontend mint button on `/alpha-passes` is immediately live and will route $BAG payments directly to your contract!
