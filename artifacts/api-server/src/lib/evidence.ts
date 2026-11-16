import { createHash } from "node:crypto";

const defaultContract = "0x25be9b00207cFe68B4c7019bF856C6d4131cDd43";

async function rpc(url: string, method: string, params: unknown[]) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Sepolia RPC request failed");
  const body = (await response.json()) as { result?: unknown; error?: unknown };
  if (body.error || typeof body.result !== "string") {
    throw new Error("Sepolia RPC returned an invalid response");
  }
  return body.result;
}

export async function verifyAlertEvidence(alertId: number, alert: Record<string, unknown>) {
  const url = process.env["SEPOLIA_RPC_URL"];
  const contractAddress = process.env["EVIDENCE_CONTRACT_ADDRESS"] || defaultContract;
  if (!url || !/^0x[0-9a-f]{40}$/i.test(contractAddress)) {
    throw new Error("Sepolia evidence is not configured");
  }

  // Preserve the v1 snapshot used by existing anchors. Investigation status is mutable.
  const snapshot = JSON.stringify([
    "cybervault-alert-v1", alert.id, alert.timestamp, alert.threat,
    alert.attack_type ?? null, alert.confidence ?? null,
    alert.binary_confidence ?? null, alert.risk_score ?? null,
    alert.severity ?? null, alert.recommended_actions ?? [],
  ]);
  const digest = "0x" + createHash("sha256").update(snapshot).digest("hex");
  const eventWord = BigInt(alertId).toString(16).padStart(64, "0");

  if (await rpc(url, "eth_chainId", []) !== "0xaa36a7") {
    throw new Error("Evidence RPC must point to Sepolia");
  }
  // evidence(uint256) returns the digest and block timestamp.
  const result = await rpc(url, "eth_call", [
    { to: contractAddress, data: "0x376dd3b1" + eventWord }, "latest",
  ]);
  if (!/^0x[0-9a-f]{128}$/i.test(result)) {
    throw new Error("Invalid evidence contract response");
  }
  const stored = result.slice(2, 66).toLowerCase();
  if (stored === "0".repeat(64)) {
    return { status: "not_anchored", digest, onChainDigest: null, anchoredAt: null, contractAddress };
  }
  const timestamp = Number(BigInt("0x" + result.slice(66)));
  return {
    status: "0x" + stored === digest ? "verified" : "mismatch",
    digest,
    onChainDigest: "0x" + stored,
    anchoredAt: new Date(timestamp * 1000).toISOString(),
    contractAddress,
  };
}
