import { verifyAccessToken } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Like authenticate.js, but never rejects an unauthenticated request — it just
// leaves req.user unset so the controller can branch on its presence. Used
// only on the couple of routes that must serve both guests and logged-in users
// (guest checkout, coupon validation); every other authenticated route keeps
// using the hard-fail authenticate middleware unchanged.
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token on an optional route — proceed as a guest rather
    // than failing the request; the customer just checks out without an
    // account instead of being blocked.
  }
  next();
});
