import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Optional + sparse-unique (not required) so guest checkout can create a User
    // doc with no Firebase identity at all — a real account still gets a unique
    // firebaseUid, but multiple guest docs having no value doesn't collide on
    // Mongo's unique-index null handling (sparse skips indexing null/missing).
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, unique: true, sparse: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    // Indexed (not unique) — used to look up/link a returning guest by phone.
    // Deliberately not unique: a hard DB constraint here would 500 on a genuine
    // shared-household number, so matching is "find first match" application
    // logic in user.service.js, not a database guarantee.
    phone: { type: String, trim: true, index: true },
    photoURL: { type: String },
    role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // True for a User doc created directly from a guest checkout (no Firebase
    // sign-in ever happened). Lets the admin Customers UI label these distinctly.
    isGuest: { type: Boolean, default: false },
    // Bumped to invalidate every outstanding token for this account at once
    // (deactivation, role change, "log out everywhere"). Stamped into each JWT as
    // `tv`; the refresh path rejects any token whose `tv` no longer matches.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
