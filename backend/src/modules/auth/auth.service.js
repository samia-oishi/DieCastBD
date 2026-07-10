import { firebaseAuth } from "../../config/firebaseAdmin.js";
import { env } from "../../config/env.js";
import { User } from "../users/user.model.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { ApiError } from "../../utils/apiError.js";

export { serializeUser } from "../users/user.service.js";

export async function verifyFirebaseIdToken(idToken) {
  try {
    return await firebaseAuth.verifyIdToken(idToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired Firebase token");
  }
}

export async function findOrCreateUser(decodedToken) {
  const { uid, email, name, picture, email_verified: emailVerified } = decodedToken;

  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    // Only auto-promote to admin when Firebase confirms the email is verified —
    // otherwise a fresh email/password sign-up using an admin address (which Firebase
    // does NOT require verifying by default) could self-escalate. Google sign-ins are
    // always verified, so this doesn't affect the normal admin sign-in path.
    const isAdminEmail = email && emailVerified && env.ADMIN_EMAILS.includes(email.toLowerCase());
    const role = isAdminEmail ? "admin" : "customer";
    user = await User.create({
      firebaseUid: uid,
      email,
      name: name || email?.split("@")[0] || "Collector",
      photoURL: picture,
      role,
    });
  }

  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  user.lastLoginAt = new Date();
  await user.save();

  return user;
}

export function issueTokens(user) {
  const payload = { sub: user._id.toString(), role: user.role, tv: user.tokenVersion };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
