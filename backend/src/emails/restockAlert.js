import { getResendClient } from "./resendClient.js";
import { env } from "../config/env.js";
import { effectivePrice } from "../utils/pricing.js";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

// Same inline-styles/table-layout/light-background reasoning as
// orderConfirmation.js — see that file's comment for why.
function renderRestockAlertHtml(product) {
  const price = effectivePrice(product);
  const productUrl = `${env.CLIENT_URL}/products/${product.slug}`;

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
          <h1 style="margin: 0 0 8px; font-size: 20px; color: #111;">It's back — ${product.title}</h1>
          <p style="margin: 0 0 24px; font-size: 14px; color: #555;">
            You asked to be notified when this one came back in stock. It's available now, but premium runs sell out fast.
          </p>

          ${
            product.thumbnail?.url
              ? `<img src="${product.thumbnail.url}" alt="${product.title}" width="120" style="display:block; border-radius: 8px; margin-bottom: 16px;" />`
              : ""
          }

          <p style="margin: 0 0 24px; font-size: 16px; font-weight: 700; color: #111;">${formatPrice(price)}</p>

          <a href="${productUrl}" style="display: inline-block; background: #a3e635; color: #0a0a0a; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 999px; text-decoration: none;">
            View product
          </a>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendRestockAlertEmail(product, contact) {
  if (!env.RESEND_API_KEY) return; // not configured — silently skip, same as order emails

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: contact,
    subject: `Back in stock — ${product.title}`,
    html: renderRestockAlertHtml(product),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
