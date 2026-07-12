// Product card image transform: just cap the delivered width — never crop,
// never force a square canvas. Catalog photos are shots of the actual retail
// packaging (blister card/box) — the packaging IS the product, so cropping
// it (c_fill) chops off real content (card header, box edge). Forcing a 1:1
// canvas (c_pad,ar_1:1) was tried too, but it bakes white letterbox bars
// into the pixels for every non-square source (this catalog is ~half 3:2
// landscape) — the photo itself then visibly doesn't fill a wide/tall card
// even though the square placeholder does, which reads as a layout bug.
// c_limit preserves the source's native aspect ratio and never upscales;
// every consuming `<img>` uses `object-contain` in a box with a matching
// background color, so the browser does any letterboxing at the CSS layer
// (transparent, no baked-in bars) instead of Cloudinary baking it into the
// image. Non-Cloudinary URLs pass through untouched.
const CARD_TRANSFORM = "c_limit,w_800";

export function cloudinaryCard(url) {
  if (!url || typeof url !== "string") return url;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  // Avoid double-injecting if a transform is already present for this size.
  if (url.includes(CARD_TRANSFORM)) return url;
  return `${url.slice(0, i + marker.length)}${CARD_TRANSFORM}/${url.slice(i + marker.length)}`;
}
