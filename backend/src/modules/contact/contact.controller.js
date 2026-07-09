import { Settings } from "../settings/settings.model.js";
import { sendContactMessageEmail } from "../../emails/contactMessage.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { env } from "../../config/env.js";

export const submitContactMessage = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne().select("contactInfo.email");
  // Prefer the admin-configured contact email (Settings editor); fall back to
  // the first ADMIN_EMAILS entry so the form still works before that's set.
  const recipient = settings?.contactInfo?.email || env.ADMIN_EMAILS[0];

  await sendContactMessageEmail(req.body, recipient);
  sendSuccess(res, { message: "Message sent" });
});
