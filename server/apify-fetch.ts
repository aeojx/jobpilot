import axios from "axios";
import https from "node:https";

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 64,
  scheduling: "lifo",
});

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRetriableApifyError(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    const code = err.code;
    const retryCodes = [
      "ECONNRESET",
      "ETIMEDOUT",
      "ECONNABORTED",
      "ENOTFOUND",
      "ECONNREFUSED",
      "EPIPE",
      "EPROTO",
      "EAI_AGAIN",
    ];
    if (code && retryCodes.includes(code)) return true;
    if (!err.response) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("socket") || msg.includes("tls") || msg.includes("network")) return true;
    }
    const st = err.response?.status;
    if (st === 429) return true;
    if (st !== undefined && st >= 500) return true;
  }
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("socket disconnected") || m.includes("tls connection") || m.includes("secure tls")) {
      return true;
    }
  }
  return false;
}

/**
 * POST JSON to Apify with keep-alive TLS, long timeout, and exponential backoff on
 * transient network/TLS failures (common in restricted sandboxes).
 */
export async function apifyPostJson<T>(
  url: string,
  body: unknown,
  options?: { timeoutMs?: number; maxRetries?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 600_000;
  const maxRetries = options?.maxRetries ?? 5;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post<T>(url, body, {
        timeout: timeoutMs,
        httpsAgent,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        validateStatus: () => true,
      });

      if (response.status === 200) {
        return response.data;
      }

      const bodyPreview =
        typeof response.data === "string" ? response.data : JSON.stringify(response.data);
      const errMsg = `Apify API returned ${response.status}: ${bodyPreview}`;

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(errMsg);
        if (attempt < maxRetries - 1) {
          const delay = Math.min(60_000, 2 ** attempt * 1000 + Math.random() * 1000);
          console.warn(
            `[Apify] HTTP ${response.status} (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms`
          );
          await sleep(delay);
          continue;
        }
        throw lastError;
      }

      throw new Error(errMsg);
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries - 1 || !isRetriableApifyError(err)) {
        throw err;
      }
      const delay = Math.min(60_000, 2 ** attempt * 1000 + Math.random() * 1000);
      console.warn(`[Apify] Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms:`, err);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Apify request failed after retries");
}
