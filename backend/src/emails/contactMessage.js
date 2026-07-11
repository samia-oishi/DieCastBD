import { getResendClient } from "./resendClient.js";
import { env } from "../config/env.js";
import { isEmail } from "../modules/restockAlerts/contactType.js";

// Plain and minimal — this is an internal notification to the store owner, not
// a customer-facing brand touchpoint, so it doesn't need the order-confirmation
// template's styling investment.
function renderContactMessageHtml({ name, contact, orderId, message }) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111;">
    <h2 style="margin: 0 0 12px;">New contact form message</h2>
    <p style="margin: 0 0 4px;"><strong>From:</strong> ${name} (${contact})</p>
    ${orderId ? `<p style="margin: 0 0 4px;"><strong>Order ID:</strong> ${orderId}</p>` : ""}
    <p style="margin: 16px 0 0; white-space: pre-wrap;">${message}</p>
  </div>`;
}

export async function sendContactMessageEmail({ name, contact, orderId, message }, recipient) {
  // Unlike order-confirmation email (a nice-to-have on top of an order that
  // already succeeded), delivering the message IS the entire point of this
  // endpoint — silently no-op'ing here would report "Message sent" for a
  // message nobody ever received. Fail loudly instead.
  if (!recipient) throw new Error("No contact recipient configured — set a contact email in Settings");

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: recipient,
    // Only email-shaped contacts can be a valid replyTo (no SMS provider).
    ...(isEmail(contact) ? { replyTo: contact } : {}),
    subject: `Contact form: ${name}`,
    html: renderContactMessageHtml({ name, contact, orderId, message }),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
