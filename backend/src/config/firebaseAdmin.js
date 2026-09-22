import { env } from "./env.js";

/** Firebase Admin, loaded the first time a token is actually verified.
 *
 * Measured 2026-09-22: importing firebase-admin costs ~134ms of CPU, and on
 * Vercel that is paid on EVERY cold start of the one function this whole API
 * runs as — while the SDK is reachable from exactly one route, POST
 * /auth/session. Every storefront read was paying to load an SDK it never
 * called, which at 98% of the Fluid Active CPU allowance is not free.
 *
 * Same move as the frontend's dynamic Firebase import (plan.md #75): the cost
 * belongs to the people who sign in, not to everyone who looks at a product.
 * Memoized, so a warm instance verifying its second token pays nothing.
 */
let authPromise = null;

export function getFirebaseAuth() {
  authPromise ??= (async () => {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          // Render preserves literal "\n" in env values; convert back to real newlines for the PEM key.
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });

    return getAuth(app);
  })();

  return authPromise;
}
