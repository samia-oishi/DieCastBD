// Injects a Cloudinary transformation string into a stored secure_url
// (".../image/upload/v169.../folder/id.jpg" -> ".../image/upload/<transform>/v169.../folder/id.jpg").
// Falls back to the original URL for anything that isn't a Cloudinary delivery
// URL (e.g. a future non-Cloudinary asset) instead of throwing.
function withTransform(url, transform) {
  if (!url) return url;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  return `${url.slice(0, i + marker.length)}${transform}/${url.slice(i + marker.length)}`;
}

// Product card / grid thumbnail — square, padded to a white background so
// products of any real aspect ratio never crop (README §Key Components).
export function productThumbUrl(url) {
  return withTransform(url, "c_pad,b_white,ar_1:1,w_800");
}
