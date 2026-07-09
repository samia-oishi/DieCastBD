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

export const listSubscribersAdmin = asyncHandler(async (req, res) => {
  const { page, limit, q } = req.query;
  const filter = {
    isActive: true,
    ...(q ? { email: { $regex: q.trim(), $options: "i" } } : {}),
  };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    NewsletterSubscriber.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(limit),
    NewsletterSubscriber.countDocuments(filter),
  ]);

  sendSuccess(res, { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
