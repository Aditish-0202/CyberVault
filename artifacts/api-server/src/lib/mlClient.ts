import { logger } from "./logger";

/**
 * Thin HTTP client for the CyberVault Python ML service (Flask).
 *
 * The dashboard never talks to the Flask service directly: every request
 * goes through this API server so the browser only needs one origin
 * (no CORS setup, no second base URL).
 */

export const ML_SERVICE_URL = (
  process.env["ML_SERVICE_URL"] ?? "http://127.0.0.1:5000"
).replace(/\/+$/, "");

const ML_TIMEOUT_MS = Number(process.env["ML_SERVICE_TIMEOUT_MS"] ?? 20000);

export class MlServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "MlServiceError";
  }
}

type MlRequestInit = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
};

export async function mlRequest<T>(
  path: string,
  init: MlRequestInit = {},
): Promise<T> {
  const url = `${ML_SERVICE_URL}${path}`;
  const method = init.method ?? "GET";

  try {
    const response = await fetch(url, {
      method,
      headers: init.body === undefined
        ? { Accept: "application/json" }
        : { Accept: "application/json", "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    });

    const text = await response.text();
    let payload: unknown = null;

    if (text.length > 0) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const upstreamMessage =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : null;

      throw new MlServiceError(
        upstreamMessage ?? `ML service responded with ${response.status}`,
        response.status,
        payload,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof MlServiceError) {
      throw error;
    }

    const reason =
      error instanceof Error ? error.message : "Unknown connection error";

    logger.warn({ url, method, reason }, "ML service request failed");

    throw new MlServiceError(
      `ML service is unreachable at ${ML_SERVICE_URL}. Is the Flask backend running?`,
      503,
      { reason },
    );
  }
}
