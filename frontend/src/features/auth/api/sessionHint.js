/** A local marker saying "this browser has signed in at some point".
 *
 * WHY: `GET /auth/me` is the one call no cache layer can help with — the answer
 * differs per visitor — and it fired on every page load for EVERY visitor,
 * including the guest majority and every crawler, only to return 401. On Vercel
 * the API is a single serverless function, so that 401 cost a cold Express boot
 * and counted against Fluid Active CPU, which reached its ceiling on
 * 2026-09-22. This lets the app skip the question when it already knows nobody
 * is signed in.
 *
 * WHY NOT read the auth cookie: it is httpOnly (deliberately — that is what
 * keeps a token out of reach of injected script), so JS cannot see it. A
 * readable companion cookie would work but must be set on the API's domain and
 * shared with the storefront's; this needs no server round trip and no cookie
 * at all.
 *
 * This is a HINT, never an authorization decision. It says only whether to ask
 * the server; the server still authenticates every request from the httpOnly
 * cookie. A forged marker buys an attacker one 401.
 *
 * Accepted cost, approved by the merchant on 2026-09-22: anyone signed in when
 * this shipped has no marker yet, so they appear signed out once and sign in
 * again. Their cookie was never touched.
 */
const KEY = "dcbd.session";

/** localStorage throws in some privacy modes; a failure must mean "ask the
 * server", which is exactly the old behaviour, never a crash. */
export function hasSessionHint() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function setSessionHint() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore — costs a request, breaks nothing */
  }
}

export function clearSessionHint() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
