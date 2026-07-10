// Absolute site origin for canonical + og:url + JSON-LD URLs. Uses VITE_SITE_URL
// in production (e.g. https://diecastbd.com); falls back to the running origin so
// dev/preview builds still emit sensible absolute URLs.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "https://diecastbd.com")
).replace(/\/$/, "");

/** Absolute URL for a path, e.g. canonical("/shop") → https://diecastbd.com/shop */
export function canonical(path = "") {
  return `${SITE_URL}${path}`;
}
