/** Payment-provider brand marks, resolved by filename so swapping an asset is a
 * drop-in replacement (any of .png / .svg / .webp) with no code change:
 *
 *   bkash.png     — the bKash app mark (white origami bird on brand crimson)
 *   banglaqr.png  — the Bangla QR mark
 *
 * Brand marks are never hand-redrawn — an approximated payment logo misrepresents
 * the provider — so these are the real assets, not traced lookalikes.
 */
const files = import.meta.glob("./*.{svg,png,webp}", { eager: true, query: "?url", import: "default" });

const find = (name) => {
  const hit = Object.entries(files).find(([path]) => path.toLowerCase().includes(name));
  return hit?.[1] ?? null;
};

export const bkashLogo = find("bkash");
export const banglaQrLogo = find("banglaqr");
