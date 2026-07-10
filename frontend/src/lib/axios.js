import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // sends the httpOnly session cookie set by POST /auth/session
});

// Refreshes the short-lived access token once on a 401 and replays the original request.
// Concurrent 401s share a single in-flight refresh instead of each firing their own.
let refreshPromise = null;
// After a refresh fails (e.g. the session was revoked or expired), stop attempting
// refresh for a short cooldown. Without this, every subsequent 401 — one per component
// or route that reads the current user on load — fires its own refresh, storming the
// endpoint (and its rate limit) instead of letting the app settle into a logged-out
// state. A successful refresh never sets the cooldown, so normal token renewal is
// unaffected.
let refreshBlockedUntil = 0;
const REFRESH_COOLDOWN_MS = 10_000;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Only /auth/refresh itself is excluded, to avoid recursing into its own retry.
    const isRefreshRoute = config?.url?.includes("/auth/refresh");
    if (response?.status !== 401 || isRefreshRoute || config._retried) {
      return Promise.reject(error);
    }

    if (Date.now() < refreshBlockedUntil) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshPromise ??= api.post("/auth/refresh").finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return api(config);
    } catch (refreshError) {
      refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
      return Promise.reject(refreshError);
    }
  }
);
