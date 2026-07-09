import { verifyRefreshToken, signAccessToken } from "../../utils/jwt.js";
import { setAuthCookies, setAccessTokenCookie, clearAuthCookies } from "../../utils/cookies.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../users/user.model.js";
import { verifyFirebaseIdToken, findOrCreateUser, issueTokens, serializeUser } from "./auth.service.js";

export const createSession = asyncHandler(async (req, res) => {
  const decoded = await verifyFirebaseIdToken(req.body.idToken);
  const user = await findOrCreateUser(decoded);
  const tokens = issueTokens(user);

  setAuthCookies(res, tokens);
  sendSuccess(res, { data: serializeUser(user), message: "Signed in" });
});

export const refreshSession = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized("Not authenticated");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Session expired, please sign in again");
  }

  // Re-derive role from the DB rather than trusting the refresh token's claim,
  // so a role change (e.g. promoted to admin) takes effect without re-login.
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized("Account no longer available");

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  setAccessTokenCookie(res, accessToken);
  sendSuccess(res, { data: serializeUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  sendSuccess(res, { message: "Signed out" });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isActive) throw ApiError.unauthorized("Account no longer available");
  sendSuccess(res, { data: serializeUser(user) });
});
