import { User } from "./user.model.js";
import { ApiError } from "../../utils/apiError.js";

// Resolves a guest checkout to a User document — creating one on first order,
// or linking to an existing one on repeat orders, per the guest-checkout
// requirement ("if phone/email matches an existing customer, link to that
// customer instead of creating a duplicate"). Email is checked first (it's the
// more precise signal); phone is the fallback since it's always present for a
// guest but not guaranteed unique (a shared household number is plausible), so
// this is deliberately "first match wins" application logic, not a DB
// constraint — see the model's comment on why `phone` isn't a unique index.
export async function findOrCreateGuestUser({ name, phone, email }) {
  const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

  let user = null;
  if (normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail });
  }
  if (!user && phone) {
    user = await User.findOne({ phone });
  }

  if (!user) {
    user = await User.create({
      name,
      phone,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      isGuest: true,
    });
  }

  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated");
  return user;
}

export function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    photoURL: user.photoURL,
    role: user.role,
  };
}

export function serializeUserAdmin(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    photoURL: user.photoURL,
    role: user.role,
    isActive: user.isActive,
    isGuest: user.isGuest,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
