import { customFetch } from "./custom-fetch";

export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
export * from './generated/api';
export * from './generated/api.schemas';

export interface AlertEvidence {
  status: "verified" | "mismatch" | "not_anchored";
  digest: string;
  onChainDigest: string | null;
  anchoredAt: string | null;
  contractAddress: string;
}

export function getAlertEvidence(id: number) {
  return customFetch<AlertEvidence>(`/api/ml/alerts/${id}/evidence`, { responseType: "json" });
}
