// Shared email/BD-phone shape checks — used by validation (accept either) and
// by the restock-notify trigger (only email-shaped contacts get auto-emailed,
// since no SMS provider exists).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_PHONE_RE = /^(?:\+?880|0)1[3-9]\d{8}$/;

export function isEmail(contact) {
  return EMAIL_RE.test(contact);
}

export function isBdPhone(contact) {
  return BD_PHONE_RE.test(contact);
}
