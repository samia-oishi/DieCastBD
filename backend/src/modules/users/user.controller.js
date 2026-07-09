import { User } from "./user.model.js";
import { serializeUser } from "./user.service.js";
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
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, { data: serializeUser(user), message: "Profile updated" });
});

export const deactivateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { isActive: false });
  if (!user) throw ApiError.notFound("User not found");
  clearAuthCookies(res);
  sendSuccess(res, { message: "Account deactivated" });
});
