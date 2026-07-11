import { RestockAlert } from "./restockAlert.model.js";
import { isEmail } from "./contactType.js";
import { sendRestockAlertEmail } from "../../emails/restockAlert.js";
import { env } from "../../config/env.js";

// Fire-and-forget from the caller (adjustStock), same pattern as
// sendOrderConfirmationEmail — a failed/unconfigured email send must never
// fail the stock update itself. Only email-shaped contacts are notified; no
// SMS provider exists, so phone subscribers stay in the admin's waiting list
// (see restockAlert.controller.js's listRestockAlertsAdmin) for manual
// follow-up. notifiedAt is only stamped on a successful send, so a
// misconfigured/failed send leaves the subscriber visibly still-waiting
// rather than silently marking them done.
export async function notifyRestockSubscribers(product) {
  // Not configured yet — leave everyone as still-waiting rather than marking
  // notifiedAt for an email that was never actually sent (sendRestockAlertEmail
  // itself silently no-ops without a key, same as order-confirmation email).
  if (!env.RESEND_API_KEY) return;

  const waiting = await RestockAlert.find({ product: product._id, notifiedAt: null });

  for (const alert of waiting) {
    if (!isEmail(alert.contact)) continue;
    try {
      await sendRestockAlertEmail(product, alert.contact);
      alert.notifiedAt = new Date();
      await alert.save();
    } catch (err) {
      console.error(`Restock alert email failed for ${alert.contact}:`, err.message);
    }
  }
}
