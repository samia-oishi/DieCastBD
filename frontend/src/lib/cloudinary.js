// Product card image transform: pad (never crop) to a 1:1 canvas. Catalog
// photos are shots of the actual retail packaging (blister card/box) — the
// packaging IS the product, so cropping it (c_fill) chops off real content
// (card header, box edge). c_pad shows the full photo always; it fills
// height with no padding for portrait/blister-shaped sources (the catalog
// norm) and pads white — matching the card's own white background — only
// for the rarer landscape source. Non-Cloudinary URLs pass through untouched.
const CARD_TRANSFORM = "c_pad,b_white,ar_1:1,w_800";

export function cloudinaryCard(url) {
  if (!url || typeof url !== "string") return url;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  // Avoid double-injecting if a transform is already present for this size.
  if (url.includes(CARD_TRANSFORM)) return url;
  return `${url.slice(0, i + marker.length)}${CARD_TRANSFORM}/${url.slice(i + marker.length)}`;
}
