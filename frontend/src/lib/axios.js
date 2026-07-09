import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // sends the httpOnly session cookie set by POST /auth/session
});

// Refreshes the short-lived access token once on a 401 and replays the original request.
// Concurrent 401s share a single in-flight refresh instead of each firing their own.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Only /auth/refresh itself is excluded, to avoid recursing into its own retry.
    const isRefreshRoute = config?.url?.includes("/auth/refresh");
    if (response?.status !== 401 || isRefreshRoute || config._retried) {
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
      return Promise.reject(refreshError);
    }
  }
);
