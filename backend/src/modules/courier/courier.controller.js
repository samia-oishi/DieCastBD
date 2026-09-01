import { sendOrderToCourier, syncCourierStatuses, linkExistingConsignment } from "./courier.service.js";
import { isCourierConfigured, getBalance } from "./steadfast.client.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const sendToCourier = asyncHandler(async (req, res) => {
  const order = await sendOrderToCourier(req.params.id);
  sendSuccess(res, { data: order, message: `Parcel created — consignment ${order.courier.consignmentId}` });
});

export const linkCourier = asyncHandler(async (req, res) => {
  const order = await linkExistingConsignment(req.params.id, req.body.consignmentId, req.body.trackingCode);
  sendSuccess(res, { data: order, message: `Linked to consignment ${order.courier.consignmentId}` });
});

export const syncCourier = asyncHandler(async (req, res) => {
  const updated = await syncCourierStatuses(req.body.ids);
  sendSuccess(res, { data: updated, message: `${updated.length} parcel(s) updated` });
});

/** Whether the courier is wired up, so the admin can hide its controls instead
 * of offering a button that can only fail. Also surfaces the account balance,
 * which is the cheapest read-only proof the credentials actually work. */
export const courierStatus = asyncHandler(async (req, res) => {
  if (!isCourierConfigured()) {
    return sendSuccess(res, { data: { configured: false, balance: null } });
  }
  const balance = await getBalance().catch(() => null);
  sendSuccess(res, { data: { configured: true, balance: balance?.current_balance ?? null } });
});
