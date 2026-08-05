import { getResendClient } from "./resendClient.js";
import { env } from "../config/env.js";
import { formatAddressArea } from "../utils/address.js";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

const PAYMENT_METHOD_LABELS = { cod: "Cash on Delivery", bkash: "bKash", banglaqr: "BanglaQR" };
const PAYMENT_OPTION_LABELS = {
  cod: "Cash on Delivery",
  deliveryOnly: "Delivery charge only",
  partialAdvance: "Partial advance",
  full: "Full payment",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Whether a status transition is the moment to tell the customer "confirmed".
 *
 * True only for pending → confirmed — the first real confirmation:
 * - packed → confirmed (admin relabelling backwards) sends nothing; the
 *   customer already heard it.
 * - cancelled/refunded → confirmed (a restore) sends nothing; the admin
 *   communicates restores personally.
 * - confirmed → pending → confirmed re-sends, correctly — the order was
 *   genuinely un-confirmed in between.
 * - The stale-order cron only ever transitions to "cancelled", so it can
 *   never pass this guard.
 *
 * Exported as a pure function so the whole decision table is unit-testable
 * without a database (same style as stockBucket).
 */
export function shouldSendOrderConfirmedEmail({ previousStatus, newStatus }) {
  return newStatus === "confirmed" && previousStatus === "pending";
}

// Same email-client constraints and light-background reasoning as
// orderConfirmation.js — see the comment there.
function renderOrderConfirmedHtml(order, user) {
  const a = order.shippingAddress ?? {};

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #111;">
            ${escapeHtml(item.title)} <span style="color: #888;">× ${item.qty}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #111; text-align: right;">
            ${formatPrice(item.price * item.qty)}
          </td>
        </tr>`
    )
    .join("");

  return `
  <div style="background: #f4f4f4; padding: 32px 16px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="background: #0a0a0a; padding: 24px 32px;">
          <span style="color: #a3e635; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">DIECAST<span style="color: #ffffff;">BD</span></span>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px;">
          <h1 style="margin: 0 0 8px; font-size: 20px; color: #111;">Good news, ${escapeHtml(user.name)} — your order is confirmed.</h1>
          <p style="margin: 0 0 24px; font-size: 14px; color: #555;">
            We've confirmed <strong>${escapeHtml(order.orderNumber)}</strong> and are getting it ready for delivery.
          </p>

          <table role="presentation" width="100%" style="border-collapse: collapse;">
            ${itemRows}
          </table>

          <table role="presentation" width="100%" style="margin-top: 16px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #555;">Subtotal</td>
              <td style="padding: 4px 0; font-size: 14px; color: #111; text-align: right;">${formatPrice(order.subtotal)}</td>
            </tr>
            ${
              order.discount > 0
                ? `<tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #555;">Discount ${order.couponCode ? `(${escapeHtml(order.couponCode)})` : ""}</td>
                    <td style="padding: 4px 0; font-size: 14px; color: #16a34a; text-align: right;">-${formatPrice(order.discount)}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #555;">Shipping</td>
              <td style="padding: 4px 0; font-size: 14px; color: #111; text-align: right;">${order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #111; border-top: 1px solid #eee;">Total</td>
              <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #111; text-align: right; border-top: 1px solid #eee;">${formatPrice(order.total)}</td>
            </tr>
          </table>

          <div style="margin-top: 32px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #111;">Delivering to</p>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">
              ${escapeHtml(a.recipientName)}<br />
              ${escapeHtml(a.addressLine1)}${a.addressLine2 ? `, ${escapeHtml(a.addressLine2)}` : ""}<br />
              ${escapeHtml(formatAddressArea(a))}<br />
              ${escapeHtml(a.phone)}
            </p>
          </div>

          <p style="margin: 24px 0 0; font-size: 13px; color: #888;">
            Payment method: ${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? escapeHtml(order.paymentMethod)}
            ${order.paymentOption && order.paymentOption !== "cod" ? ` (${PAYMENT_OPTION_LABELS[order.paymentOption] ?? escapeHtml(order.paymentOption)})` : ""}
          </p>
          ${
            order.amountDue > 0
              ? `<div style="margin-top: 12px; padding: 12px 16px; background: #fff7ed; border-radius: 8px; border: 1px solid #fed7aa;">
                  <p style="margin: 0; font-size: 13px; color: #9a3412;">
                    You've paid <strong>${formatPrice(order.amountPaid)}</strong> so far — the remaining
                    <strong>${formatPrice(order.amountDue)}</strong> is due on delivery.
                  </p>
                </div>`
              : ""
          }
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendOrderConfirmedEmail(order, user) {
  if (!env.RESEND_API_KEY) return; // not configured — silently skip, never fail the status change

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: user.email,
    subject: `${order.orderNumber} is confirmed — we're getting it ready`,
    html: renderOrderConfirmedHtml(order, user),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
