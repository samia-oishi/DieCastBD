import { NewsletterSubscriber } from "./newsletter.model.js";
import { listAudience, getAudienceCounts } from "./audience.service.js";
import { ApiError } from "../../utils/apiError.js";
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

/** Every address the shop holds, grouped by where it came from.
 *
 * Separate from listSubscribersAdmin rather than replacing it: that endpoint
 * backs the actual marketing list, and the two answer different questions —
 * "who opted in" versus "whose email do we have". Counts ride along in `meta`
 * so the filter chips can show them without four more round trips.
 */
export const listAudienceAdmin = asyncHandler(async (req, res) => {
  const { page, limit, source, q } = req.query;
  const [{ items, meta }, counts] = await Promise.all([
    listAudience({ source, q, page, limit }),
    getAudienceCounts(),
  ]);

  sendSuccess(res, { data: items, meta: { ...meta, counts } });
});

export const deleteSubscriberAdmin = asyncHandler(async (req, res) => {
  // Hard delete, not a flag flip: an admin removing someone from the list means
  // "they're gone", and the model's unique email index lets them resubscribe
  // later without colliding with a soft-deleted row.
  const subscriber = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  if (!subscriber) throw ApiError.notFound("Subscriber not found");
  sendSuccess(res, { message: `${subscriber.email} removed` });
});
