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
  const { uid, email, name, picture } = decodedToken;

  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    const role = email && env.ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "customer";
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
  const payload = { sub: user._id.toString(), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
