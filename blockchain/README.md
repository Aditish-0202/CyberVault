# Sepolia evidence registry

1. Compile `CyberVaultEvidence.sol` with Solidity 0.8.24 in Remix. Select Sepolia in MetaMask, connect Remix to the wallet, and deploy the contract with test ETH. The deploying wallet is the authorized writer.
2. Set `VITE_EVIDENCE_CONTRACT_ADDRESS` to the deployed contract address in the dashboard environment. Restart Vite locally or rebuild the hosted frontend.
3. Open Detection, run the sample analysis, then select **Anchor evidence** on the saved alert. Approve the transaction in the writer wallet. After it confirms, select **Verify evidence**.
4. Confirm the dashboard shows the anchor time and the transaction on Sepolia Etherscan. Try anchoring another saved alert and verify each independently.

The frontend computes SHA-256 over a versioned, ordered snapshot of the saved alert. Verification reloads the alert from the API, recomputes its digest, and compares it with the registry entry. Editable investigation status is excluded. The contract stores the digest and block timestamp under the event ID. Raw network traffic and full logs stay off-chain.

Use one registry deployment per persistent alert database. If the database is reset or replaced, deploy a new registry so reused numeric alert IDs do not collide. The dashboard requires HTTPS or localhost for browser SHA-256. Wallet keys stay in the wallet.
