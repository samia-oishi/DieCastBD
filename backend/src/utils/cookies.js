import { env, isProduction } from "../config/env.js";
import { parseDurationMs } from "./parseDuration.js";

// sameSite:"none" is required once frontend/backend live on different domains in production
// (it needs secure:true, which is why this is env-gated rather than a fixed value).
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
    path: "/api/v1/auth/refresh",
  });
}

export function setAccessTokenCookie(res, accessToken) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: parseDurationMs(env.JWT_ACCESS_EXPIRES_IN),
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", { ...baseCookieOptions, path: "/api/v1/auth/refresh" });
}
