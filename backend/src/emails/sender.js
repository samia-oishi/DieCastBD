/** Shared identity for every outgoing email.
 *
 * WHY these are constants and not `env.EMAIL_FROM`: the From must carry a
 * display name ("DiecastBD <orders@…>"), and env.js validates EMAIL_FROM with
 * Zod's `.email()`, which rejects that format — putting the correct value in
 * the env var would fail validation and stop the server booting. Keeping it in
 * code also means the sender can't silently differ between environments.
 *
 * WHY NOT no-reply: replies to a no-reply address bounce, so a customer
 * answering their own order confirmation is simply lost. Resend's
 * deliverability Insights flags it too — mailbox providers read replies and
 * other engagement as a positive inbox-placement signal, and a no-reply sender
 * suppresses exactly that signal.
 */

/** The envelope sender. MUST stay on diecastbd.com: the domain is Resend-verified
 * with DKIM/SPF/DMARC passing, and pointing From at a Gmail address instead would
 * break DMARC alignment and land the mail in spam. `orders@` needs no mailbox —
 * nothing is delivered to it; REPLY_TO is what routes actual replies. */
export const EMAIL_FROM = "DiecastBD <orders@diecastbd.com>";

/** Where replies actually land. TODO: switch to hello@diecastbd.com once that
 * mailbox exists — diecastbd.com has no inbox yet, so a working Gmail address
 * is the only thing that can receive a customer's reply today. */
export const EMAIL_REPLY_TO = "diecastbd.official@gmail.com";

/** Logo for email headers. Absolute https and PNG because Gmail strips SVG and
 * CID attachments; served from this API (see app.js) so a storefront rebuild
 * can't content-hash the filename out from under a sent email.
 *
 * Sourced at 336x90 and displayed at 168x45 — 2x for retina. The wordmark inside
 * it is 144x21, the exact 48:7 aspect of the master so nothing is stretched
 * (48:7 has no integer height at 120px wide, which is why it is not ~120px).
 * Width/height are set as HTML ATTRIBUTES at the call site, not CSS: Outlook
 * ignores CSS sizing and would otherwise render this at full size.
 *
 * WHY the #0a0a0a plate is baked INTO the png rather than left to the header
 * cell's background: Gmail's mobile dark mode recolours an email's inline
 * styles, and it inverts this template — the white card renders dark and the
 * dark header cell renders WHITE. The wordmark is white-on-dark, so against a
 * flipped-to-white cell it would be invisible. Gmail does not recolour image
 * pixels, so a logo carrying its own background survives either way. Templates
 * here are bare fragments with no <head>, so the usual
 * <meta name="color-scheme"> opt-out is not available to us. */
export const EMAIL_LOGO_URL = "https://api.diecastbd.com/email-logo.png";
export const EMAIL_LOGO_WIDTH = 168;
export const EMAIL_LOGO_HEIGHT = 45;

/** The header logo row, table-based to match the surrounding templates —
 * flexbox and grid are unsupported in Outlook. Alt text matters: most clients
 * block images by default, so "DiecastBD" is what the customer sees first. */
export function renderEmailLogo() {
  return `<img src="${EMAIL_LOGO_URL}" width="${EMAIL_LOGO_WIDTH}" height="${EMAIL_LOGO_HEIGHT}" alt="DiecastBD" style="display: block; border: 0; outline: none; text-decoration: none;" />`;
}
