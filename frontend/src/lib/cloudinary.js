// Shared "inject a transform string after /upload/" logic for every tier
// below. c_limit preserves the source's native aspect ratio and never
// upscales; every consuming `<img>` uses `object-contain`/`object-cover` in a
// box with a matching background color, so the browser does any letterboxing
// at the CSS layer instead of Cloudinary baking it into the image.
// Non-Cloudinary URLs pass through untouched.
function withTransform(url, transform) {
  if (!url || typeof url !== "string") return url;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  // Avoid double-injecting if this exact transform is already present.
  if (url.includes(transform)) return url;
  return `${url.slice(0, i + marker.length)}${transform}/${url.slice(i + marker.length)}`;
}

// Product card image transform: just cap the delivered width — never crop,
// never force a square canvas. Catalog photos are shots of the actual retail
// packaging (blister card/box) — the packaging IS the product, so cropping
// it (c_fill) chops off real content (card header, box edge). Forcing a 1:1
// canvas (c_pad,ar_1:1) was tried too, but it bakes white letterbox bars
// into the pixels for every non-square source (this catalog is ~half 3:2
// landscape) — the photo itself then visibly doesn't fill a wide/tall card
// even though the square placeholder does, which reads as a layout bug.
const CARD_TRANSFORM = "c_limit,w_800,f_auto,q_auto";

export function cloudinaryCard(url) {
  return withTransform(url, CARD_TRANSFORM);
}

// Hero banners render up to h-[520px] full-bleed (PhotoHero) — much larger
// than any product card — so the 800px card cap would visibly soften them.
const HERO_TRANSFORM = "c_limit,w_1600,f_auto,q_auto";

export function cloudinaryHero(url) {
  return withTransform(url, HERO_TRANSFORM);
}

// Small fixed-size thumbnails (cart line items, checkout/receipt line items —
// all well under 100px tall) don't need the full 800px card image.
const THUMB_TRANSFORM = "c_limit,w_200,f_auto,q_auto";

export function cloudinaryThumb(url) {
  return withTransform(url, THUMB_TRANSFORM);
}

// Product-detail hover magnifier + full-screen dialog: the region under the
// cursor is shown ~2.5x, so it needs more detail than the 800px card cap to
// stay sharp. Fetched only when the shopper hovers/opens the image, never in
// the catalog grid, so the PDP's initial main image stays the lighter w_800.
const ZOOM_TRANSFORM = "c_limit,w_1600,f_auto,q_auto";

export function cloudinaryZoom(url) {
  return withTransform(url, ZOOM_TRANSFORM);
}

// The full-screen viewer's "actual size" mode shows real pixels, so it must not
// be resized at all — only format/quality optimised. cloudinaryZoom caps at
// w_1600, which is right for the hover magnifier but means the viewer could
// never actually reach 100% of the original.
const FULL_TRANSFORM = "f_auto,q_auto";

export function cloudinaryFull(url) {
  return withTransform(url, FULL_TRANSFORM);
}
