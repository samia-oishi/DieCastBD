import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    photoURL: { type: String },
    role: { type: String, enum: ["customer", "staff", "admin"], default: "customer" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // Bumped to invalidate every outstanding token for this account at once
    // (deactivation, role change, "log out everywhere"). Stamped into each JWT as
    // `tv`; the refresh path rejects any token whose `tv` no longer matches.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
