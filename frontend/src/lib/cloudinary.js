// Product card image transform per the design/HANDOFF spec: pad to a 1:1 white
// canvas so photos of varying dimensions render consistently object-contain on
// white with breathing room. Non-Cloudinary URLs pass through untouched.
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
