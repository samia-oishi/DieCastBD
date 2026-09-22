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

/** Classifies a Steadfast error response.
 *
 * Steadfast answers 401 for TWO unrelated situations, and telling them apart
 * matters because one of them locks the merchant's account:
 *
 *   bad credentials     JSON body, e.g.
 *                       {"status":401,"message":"Unauthorized Access (invalid
 *                        API credentials)","attempts_left":8}
 *                       — the counter is real; the account locks at zero.
 *
 *   unknown consignment plain text "Unauthorized Access", no counter. Verified
 *                       against the live API: a get_balance immediately
 *                       afterwards still returns 200, so this does NOT count
 *                       against the lockout budget. Calling it an auth failure
 *                       would both mislead the merchant and make us fear a
 *                       harmless typo.
 */
export function classifySteadfastError(status, body) {
  const attemptsLeft = body && typeof body === "object" ? body.attempts_left : undefined;
  if (status === 401 && attemptsLeft !== undefined) {
    return { kind: "auth", attemptsLeft, message: `${body.message ?? "Invalid API credentials"} (${attemptsLeft} attempts left before lockout)` };
  }
  if (status === 401 || status === 404) {
    return { kind: "not_found", message: "Steadfast does not recognise that consignment" };
  }
  const message = (body && typeof body === "object" && body.message) || `HTTP ${status}`;
  return { kind: "error", message };
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

  // Read as text first: an unknown consignment answers with bare text, not
  // JSON, and res.json() on that would throw away the only signal we have.
  const raw = await res.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!res.ok || (payload?.status && payload.status >= 400)) {
    const classified = classifySteadfastError(payload?.status ?? res.status, payload);
    const err = new Error(`Steadfast: ${classified.message}`);
    // NEVER retry a credential failure: their counter locks the account, so a
    // retry loop would take the merchant's courier offline rather than recover.
    err.isAuthFailure = classified.kind === "auth";
    err.isNotFound = classified.kind === "not_found";
    throw err;
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

/** Steadfast's own risk score for a phone number, out of 100.
 *
 * Verified against the live API 2026-09-22; the shape is:
 *   { status: 200, phone, score: 55, level: "caution",
 *     reasons: ["history_little", "ratio_high", "reports_none"],
 *     doubtful_reports: false, total_reports: 0 }
 *
 * `level` and the `reasons` codes are NOT documented anywhere we can see, so
 * nothing here interprets them — they are passed through and rendered as the
 * courier wrote them. Inventing a translation ("ratio_high" = ?) would put a
 * guess in front of a merchant deciding whether to ship goods on credit.
 */
export function getFraudScore(phone) {
  return request("GET", `/fraud_check/score/${encodeURIComponent(phone)}`);
}

/** Account balance — the cheapest read-only call, used to verify credentials. */
export function getBalance() {
  return request("GET", "/get_balance");
}
