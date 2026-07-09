import { getResendClient } from "./resendClient.js";
import { env } from "../config/env.js";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

// Inline styles + table layout throughout — email clients (Outlook especially)
// don't support external stylesheets or most modern CSS, so this is the
// actually-reliable way to build transactional HTML email. A light background
// is a deliberate departure from the site's dark theme: dark-mode HTML email
// renders inconsistently (and sometimes illegibly) across clients that force
// their own color schemes, so transactional email prioritizes universal
// legibility over 1:1 brand-theme parity.
function renderOrderConfirmationHtml(order, user) {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #111;">
            ${item.title} <span style="color: #888;">× ${item.qty}</span>
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
          <h1 style="margin: 0 0 8px; font-size: 20px; color: #111;">Thanks for your order, ${user.name}.</h1>
          <p style="margin: 0 0 24px; font-size: 14px; color: #555;">
            Order <strong>${order.orderNumber}</strong> has been placed and is now pending confirmation.
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
                    <td style="padding: 4px 0; font-size: 14px; color: #555;">Discount ${order.couponCode ? `(${order.couponCode})` : ""}</td>
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
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #111;">Shipping to</p>
            <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">
              ${order.shippingAddress.recipientName}<br />
              ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}<br />
              ${order.shippingAddress.city}${order.shippingAddress.district ? `, ${order.shippingAddress.district}` : ""}<br />
              ${order.shippingAddress.phone}
            </p>
          </div>

          <p style="margin: 24px 0 0; font-size: 13px; color: #888;">
            Payment method: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "bKash"}
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendOrderConfirmationEmail(order, user) {
  if (!env.RESEND_API_KEY) return; // not configured yet — silently skip rather than fail order creation

  const resend = getResendClient();
  // The SDK resolves to {data, error} on API-level failures rather than throwing —
  // without this check a failed send would never reach the caller's catch block.
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: user.email,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: renderOrderConfirmationHtml(order, user),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
