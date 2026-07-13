/** Payment-provider brand marks.
 *
 * Drop the official files into this folder and they are picked up automatically —
 * no code change needed anywhere:
 *
 *   src/assets/payments/bkash.svg      (or .png — the crimson origami-bird mark)
 *   src/assets/payments/banglaqr.svg   (or .png — the BANGLA QR mark)
 *
 * Until a file is present, `PaymentLogo` falls back to a plain text/icon chip so
 * checkout never renders a broken image. Brand marks are deliberately NOT
 * hand-redrawn as inline SVG here: an approximated payment logo misrepresents the
 * provider, so the real asset is the only acceptable source.
 */
const files = import.meta.glob("./*.{svg,png,webp}", { eager: true, query: "?url", import: "default" });

const find = (name) => {
  const hit = Object.entries(files).find(([path]) => path.toLowerCase().includes(name));
  return hit?.[1] ?? null;
};

export const bkashLogo = find("bkash");
export const banglaQrLogo = find("banglaqr");
