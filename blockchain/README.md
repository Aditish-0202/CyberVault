# Sepolia evidence registry

The Express API uses PublicNode’s Sepolia RPC by default. To use another Sepolia JSON-RPC endpoint, set `SEPOLIA_RPC_URL` on the Express server. Keep provider credentials server-side. The API defaults to registry `0x25be9b00207cFe68B4c7019bF856C6d4131cDd43`. Set `EVIDENCE_CONTRACT_ADDRESS` on the API server to override it with another Sepolia deployment. Restart or redeploy the API after changing these values.

Open Detection and run the sample analysis. On the saved alert, click **Anchor evidence** and approve it in MetaMask using the deploying wallet. Wait for confirmation. Then sign in to CyberVault in an incognito window and click **Verify evidence** on the same alert. It shows the integrity result, both hashes when anchored, and the block timestamp. Browser wallet access and test ETH are needed only for signing.

The API reloads the alert from Flask and computes the existing v1 SHA-256 evidence digest. The editable investigation status is excluded. The contract stores a digest and block timestamp under the event ID. Raw logs and complete alerts stay off-chain.

Each persistent alert database needs its own registry. If the database is replaced or reset, use a fresh registry to avoid collisions from reused numeric alert IDs. To create one, compile `CyberVaultEvidence.sol` in Remix, select Sepolia via MetaMask and deploy. The deploying wallet is the authorized writer.
