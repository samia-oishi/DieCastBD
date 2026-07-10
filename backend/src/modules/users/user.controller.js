import { User } from "./user.model.js";
import { serializeUser, serializeUserAdmin } from "./user.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { clearAuthCookies } from "../../utils/cookies.js";

// Explicit whitelist rather than passing req.body wholesale — even though `validate()`
// strips fields the schema doesn't define, a controller that forwards req.body directly
// to Mongoose is one middleware refactor away from a mass-assignment bug (e.g. a smuggled
// "role"). This makes what's editable here self-evident without depending on that.
const SELF_EDITABLE_FIELDS = ["name", "phone", "photoURL"];

export const updateMe = asyncHandler(async (req, res) => {
  const updates = Object.fromEntries(
    SELF_EDITABLE_FIELDS.filter((field) => field in req.body).map((field) => [field, req.body[field]])
  );

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, { data: serializeUser(user), message: "Profile updated" });
});

export const deactivateMe = asyncHandler(async (req, res) => {
  // Bump tokenVersion so any other outstanding sessions (another device) are killed
  // too, not just the cookies we clear on this one.
  const user = await User.findByIdAndUpdate(req.user.id, { isActive: false, $inc: { tokenVersion: 1 } });
  if (!user) throw ApiError.notFound("User not found");
  clearAuthCookies(res);
  sendSuccess(res, { message: "Account deactivated" });
});

export const listUsersAdmin = asyncHandler(async (req, res) => {
  const { page, limit, q, role, isActive } = req.query;
  const filter = {
    ...(role ? { role } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(q ? { $or: [{ name: { $regex: q.trim(), $options: "i" } }, { email: { $regex: q.trim(), $options: "i" } }] } : {}),
  };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: items.map(serializeUserAdmin),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getUserAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, { data: serializeUserAdmin(user) });
});

const ADMIN_EDITABLE_FIELDS = ["name", "phone", "isActive"];

export const updateUserAdmin = asyncHandler(async (req, res) => {
  const updates = Object.fromEntries(
    ADMIN_EDITABLE_FIELDS.filter((field) => field in req.body).map((field) => [field, req.body[field]])
  );

  // Deactivating an account from the admin panel should end its sessions immediately,
  // same as self-deactivation — otherwise a banned user keeps their refresh token.
  if (updates.isActive === false) updates.$inc = { tokenVersion: 1 };

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, { data: serializeUserAdmin(user), message: "User updated" });
});

// Role changes get their own endpoint (not folded into updateUserAdmin) so these
// guard clauses can't be bypassed by a general profile edit: an admin can't demote
// their own account, and can't demote the last remaining admin — both would lock
// everyone out of the dashboard.
export const changeUserRole = asyncHandler(async (req, res) => {
  const { role: newRole } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound("User not found");

  if (target._id.toString() === req.user.id) {
    throw ApiError.forbidden("You cannot change your own role");
  }

  if (target.role === "admin" && newRole !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) throw ApiError.forbidden("Cannot demote the last remaining admin");
  }

  // Bump tokenVersion so the affected user re-authenticates under their new role
  // right away — a demotion shouldn't leave stale admin/staff access alive on their
  // existing tokens until they happen to expire.
  target.role = newRole;
  target.tokenVersion += 1;
  await target.save();
  sendSuccess(res, { data: serializeUserAdmin(target), message: "Role updated" });
});
