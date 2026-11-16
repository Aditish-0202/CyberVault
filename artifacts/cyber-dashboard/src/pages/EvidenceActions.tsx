import { useState } from 'react';
import type { MlAlert } from '@workspace/api-client-react';

type Wallet = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
const contract = import.meta.env.VITE_EVIDENCE_CONTRACT_ADDRESS as string | undefined;
const sepolia = '0xaa36a7';

async function digestAlert(alert: MlAlert) {
  // Fixed field order is part of the v1 evidence format. Status is editable.
  const snapshot = JSON.stringify([
    'cybervault-alert-v1', alert.id, alert.timestamp, alert.threat,
    alert.attack_type ?? null, alert.confidence ?? null,
    alert.binary_confidence ?? null, alert.risk_score ?? null,
    alert.severity ?? null, alert.recommended_actions ?? [],
  ]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(snapshot));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function EvidenceActions({ refreshAlert }: { refreshAlert: () => Promise<MlAlert> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [transaction, setTransaction] = useState('');

  async function run(action: 'anchor' | 'verify') {
    setBusy(true);
    setMessage('');
    try {
      const wallet = (window as Window & { ethereum?: Wallet }).ethereum;
      if (!wallet) throw new Error('Open CyberVault in a browser with an Ethereum wallet.');
      if (!contract || !/^0x[\da-f]{40}$/i.test(contract)) {
        throw new Error('Configure the Sepolia evidence contract address.');
      }
      if (await wallet.request({ method: 'eth_chainId' }) !== sepolia) {
        throw new Error('Switch your wallet to Sepolia.');
      }

      const alert = await refreshAlert();
      if (!Number.isSafeInteger(alert.id) || alert.id <= 0) {
        throw new Error('Invalid alert ID.');
      }
      const digest = await digestAlert(alert);
      const eventId = BigInt(alert.id).toString(16).padStart(64, '0');
      // evidence(uint256) returns the digest and block timestamp as two ABI words.
      const evidence = await wallet.request({
        method: 'eth_call',
        params: [{ to: contract, data: '0x376dd3b1' + eventId }, 'latest'],
      });
      if (typeof evidence !== 'string' || !/^0x[\da-f]{128}$/i.test(evidence)) {
        throw new Error('The configured contract did not return an evidence record.');
      }
      const anchoredDigest = evidence.slice(2, 66).toLowerCase();
      const anchored = anchoredDigest !== '0'.repeat(64);
      if (anchored) {
        const timestamp = Number(BigInt('0x' + evidence.slice(66)));
        setMessage(anchoredDigest === digest
          ? 'Evidence verified. Anchored ' + new Date(timestamp * 1000).toISOString()
          : 'Integrity check failed. The saved alert hash differs from the on-chain hash.');
        return;
      }
      if (action === 'verify') {
        setMessage('No confirmed evidence anchor found.');
        return;
      }

      const accounts = await wallet.request({ method: 'eth_requestAccounts' });
      const from = Array.isArray(accounts) ? accounts[0] : undefined;
      if (typeof from !== 'string') throw new Error('Connect the contract writer wallet.');
      if (await wallet.request({ method: 'eth_chainId' }) !== sepolia) {
        throw new Error('Switch your wallet to Sepolia.');
      }
      // anchor(uint256,bytes32)
      const hash = await wallet.request({
        method: 'eth_sendTransaction',
        params: [{ from, to: contract, data: '0xa0ca2d08' + eventId + digest }],
      });
      if (typeof hash !== 'string' || !/^0x[\da-f]{64}$/i.test(hash)) {
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

  if (!contract) return null;
  return (
    <div className="flex w-full flex-wrap items-center gap-3 text-xs">
      <button type="button" disabled={busy} onClick={() => void run('anchor')}>
        Anchor evidence
      </button>
      <button type="button" disabled={busy} onClick={() => void run('verify')}>
        Verify evidence
      </button>
      {transaction && (
        <a href={'https://sepolia.etherscan.io/tx/' + transaction} target="_blank" rel="noreferrer">
          View transaction
        </a>
      )}
      <span role="status">{message}</span>
    </div>
  );
}
