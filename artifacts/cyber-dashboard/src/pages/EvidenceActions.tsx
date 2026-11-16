import { useState } from 'react';
import { getAlertEvidence, type AlertEvidence } from '@workspace/api-client-react';

type Wallet = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
const sepolia = '0xaa36a7';

export function EvidenceActions({ alertId }: { alertId: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [transaction, setTransaction] = useState('');
  const [proof, setProof] = useState<AlertEvidence | null>(null);

  async function run(action: 'anchor' | 'verify') {
    setBusy(true);
    setMessage('');
    setProof(null);
    try {
      const evidence = await getAlertEvidence(alertId);
      if (action === 'verify' || evidence.status !== 'not_anchored') {
        setProof(evidence);
        return;
      }

      const wallet = (window as Window & { ethereum?: Wallet }).ethereum;
      if (!wallet) throw new Error('Open CyberVault in a browser with an Ethereum wallet.');
      const accounts = await wallet.request({ method: 'eth_requestAccounts' });
      const from = Array.isArray(accounts) ? accounts[0] : undefined;
      if (typeof from !== 'string') throw new Error('Connect the contract writer wallet.');
      if (await wallet.request({ method: 'eth_chainId' }) !== sepolia) {
        throw new Error('Switch your wallet to Sepolia.');
      }

      const eventWord = BigInt(alertId).toString(16).padStart(64, '0');
      // anchor(uint256,bytes32)
      const hash = await wallet.request({
        method: 'eth_sendTransaction',
        params: [{
          from, to: evidence.contractAddress,
          data: '0xa0ca2d08' + eventWord + evidence.digest.slice(2),
        }],
      });
      if (typeof hash !== 'string' || !/^0x[0-9a-f]{64}$/i.test(hash)) {
        throw new Error('The wallet did not return a transaction hash.');
      }
      setTransaction(hash);
      setMessage('Transaction submitted. Verify evidence after it confirms.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Evidence request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-3 text-xs">
      <button type="button" disabled={busy} onClick={() => void run('anchor')}>Anchor evidence</button>
      <button type="button" disabled={busy} onClick={() => void run('verify')}>Verify evidence</button>
      {transaction && (
        <a href={'https://sepolia.etherscan.io/tx/' + transaction} target="_blank" rel="noreferrer">
          View transaction
        </a>
      )}
      <span role="status">{message}</span>
      {proof && (
        <div className="w-full space-y-1 break-all" role="status">
          <p>{proof.status === 'verified' ? 'Evidence verified' :
            proof.status === 'mismatch' ? 'Integrity check failed' : 'No confirmed evidence anchor found'}</p>
          <p>Saved alert hash: <code>{proof.digest}</code></p>
          {proof.onChainDigest && <p>Sepolia hash: <code>{proof.onChainDigest}</code></p>}
          {proof.anchoredAt && <p>Anchored at: {proof.anchoredAt}</p>}
          <a href={'https://sepolia.etherscan.io/address/' + proof.contractAddress} target="_blank" rel="noreferrer">
            View Sepolia contract
          </a>
        </div>
      )}
    </div>
  );
}
