import { env } from "../../config/env.js";

/** Thin client for Steadfast Courier's API (portal.packzy.com/api/v1).
 *
 * Lazy like emails/resendClient.js: credentials stay optional in env.js, and
 * nothing fails until the courier is actually used.
 */
const BASE_URL = "https://portal.packzy.com/api/v1";

export function isCourierConfigured() {
  return Boolean(env.STEADFAST_API_KEY && env.STEADFAST_SECRET_KEY);
}

async function request(method, path, body) {
  if (!isCourierConfigured()) {
    throw new Error("Steadfast is not configured — set STEADFAST_API_KEY and STEADFAST_SECRET_KEY");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Api-Key": env.STEADFAST_API_KEY,
      "Secret-Key": env.STEADFAST_SECRET_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || (payload?.status && payload.status >= 400)) {
    // NEVER retry a 401. Steadfast counts failed authentications and locks the
    // account — their error body carries an `attempts_left` countdown — so a
    // retry loop on bad credentials would take the merchant's courier account
    // offline rather than recover anything.
    const detail = payload?.message ?? `HTTP ${res.status}`;
    const attempts = payload?.attempts_left != null ? ` (${payload.attempts_left} attempts left before lockout)` : "";
    throw new Error(`Steadfast: ${detail}${attempts}`);
  }

  return payload;
}

/** Creates a consignment. This is a REAL parcel Steadfast will try to collect. */
export function createConsignment(payload) {
  return request("POST", "/create_order", payload);
}

/** Current delivery_status for one consignment. */
export function getDeliveryStatus(consignmentId) {
  return request("GET", `/status_by_cid/${encodeURIComponent(consignmentId)}`);
}

/** Account balance — the cheapest read-only call, used to verify credentials. */
export function getBalance() {
  return request("GET", "/get_balance");
}
