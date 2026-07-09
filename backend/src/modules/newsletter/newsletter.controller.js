import { NewsletterSubscriber } from "./newsletter.model.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await NewsletterSubscriber.findOneAndUpdate(
    { email },
    { email, isActive: true },
    { upsert: true, setDefaultsOnInsert: true }
  );

  sendSuccess(res, { message: "Subscribed" });
});
