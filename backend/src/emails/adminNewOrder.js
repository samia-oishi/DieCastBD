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

/** Customer-typed strings (names, addresses, delivery notes) end up inside this
 * HTML — escape them so a note like `<img onerror=…>` can't run in the admin's
 * mail client. Older templates interpolate raw; new ones don't. */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Internal notification to the store owner — plain, scannable, everything
// needed to act on the order without opening the dashboard (though the button
// is there for when they want to). Same deliberate light-background reasoning
// as orderConfirmation.js.
function renderAdminNewOrderHtml(order) {
  const a = order.shippingAddress ?? {};

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #111;">
            ${escapeHtml(item.title)} <span style="color: #888;">× ${item.qty}</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #111; text-align: right; white-space: nowrap;">
            ${formatPrice(item.price * item.qty)}
          </td>
        </tr>`
    )
    .join("");

  const moneyRow = (label, value, strong = false) => `
    <tr>
      <td style="padding: 3px 0; font-size: ${strong ? 15 : 13}px; color: ${strong ? "#111" : "#555"}; ${strong ? "font-weight: 700; border-top: 1px solid #eee; padding-top: 10px;" : ""}">${label}</td>
      <td style="padding: 3px 0; font-size: ${strong ? 15 : 13}px; color: #111; text-align: right; ${strong ? "font-weight: 700; border-top: 1px solid #eee; padding-top: 10px;" : ""}">${value}</td>
    </tr>`;

  const paymentRef = order.bkashTransactionId
    ? `bKash last 4 digits: <strong>${escapeHtml(order.bkashTransactionId)}</strong>`
    : order.banglaQrReference
      ? `BanglaQR reference: <strong>${escapeHtml(order.banglaQrReference)}</strong>`
      : "";

  return `
  <div style="background: #f4f4f4; padding: 24px 16px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <tr>
        <td style="padding: 24px 28px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">New order</p>
          <h1 style="margin: 0 0 4px; font-size: 20px; color: #111;">${escapeHtml(order.orderNumber)} — ${formatPrice(order.total)}</h1>
          <p style="margin: 0 0 20px; font-size: 13px; color: #555;">
            Placed ${new Date(order.createdAt ?? Date.now()).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </p>

          <table role="presentation" width="100%" style="border-collapse: collapse;">
            ${itemRows}
          </table>

          <table role="presentation" width="100%" style="margin-top: 12px; border-collapse: collapse;">
            ${moneyRow("Subtotal", formatPrice(order.subtotal))}
            ${order.discount > 0 ? moneyRow(`Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}`, `-${formatPrice(order.discount)}`) : ""}
            ${moneyRow("Shipping", order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free")}
            ${moneyRow("Total", formatPrice(order.total), true)}
            ${order.amountPaid > 0 ? moneyRow("Paid", formatPrice(order.amountPaid)) : ""}
            ${order.amountDue > 0 ? moneyRow("Due on delivery", formatPrice(order.amountDue)) : ""}
          </table>

          <div style="margin-top: 20px; padding: 14px 16px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.5px;">Payment</p>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6;">
              ${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? escapeHtml(order.paymentMethod)}
              ${order.paymentOption && order.paymentOption !== "cod" ? ` — ${PAYMENT_OPTION_LABELS[order.paymentOption] ?? escapeHtml(order.paymentOption)}` : ""}
              ${paymentRef ? `<br />${paymentRef}` : ""}
            </p>
          </div>

          <div style="margin-top: 12px; padding: 14px 16px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.5px;">Deliver to</p>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6;">
              ${escapeHtml(a.recipientName)}<br />
              ${escapeHtml(a.addressLine1)}${a.addressLine2 ? `, ${escapeHtml(a.addressLine2)}` : ""}<br />
              ${escapeHtml(formatAddressArea(a))}<br />
              ${escapeHtml(order.phone || a.phone)}
            </p>
            ${order.deliveryNote ? `<p style="margin: 8px 0 0; font-size: 13px; color: #9a3412;">Note: ${escapeHtml(order.deliveryNote)}</p>` : ""}
          </div>

          <table role="presentation" style="margin-top: 24px;">
            <tr>
              <td style="background: #a3e635; border-radius: 999px;">
                <a href="${env.CLIENT_URL}/admin/orders/${order._id}" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 700; color: #0a0a0a; text-decoration: none;">View in admin</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

/** Notifies the store owner that an order was placed.
 *
 * Silent-skip guards on both the API key and the recipient: by the time this
 * runs the order has already succeeded, so "no email configured" must be a
 * no-op, never a failure the customer could see. Resend API errors still throw
 * so the caller's .catch can log them.
 */
export async function sendAdminNewOrderEmail(order, recipient) {
  if (!env.RESEND_API_KEY) return;
  if (!recipient) return;

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: recipient,
    subject: `New order ${order.orderNumber} — ${formatPrice(order.total)}`,
    html: renderAdminNewOrderHtml(order),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
