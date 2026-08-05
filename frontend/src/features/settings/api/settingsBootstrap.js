/** Settings baked into the HTML at build time by scripts/prerender.mjs.
 *
 * The homepage snapshot carries a <script id="__SETTINGS__"> payload so the
 * app's FIRST client render already knows the hero variant, which sections are
 * on, and the nav/footer content. Without it every visitor got a render with
 * `settings === undefined` — which meant a guessed hero that then visibly
 * swapped, and sections that appeared or vanished a moment later.
 *
 * Absent on every other route (they're served the neutral app.html shell) and
 * in dev, where this returns undefined and the app behaves exactly as before.
 */
let cached;

export function readBakedSettings() {
  if (cached !== undefined) return cached;
  cached = null;

  if (typeof document !== "undefined") {
    const el = document.getElementById("__SETTINGS__");
    if (el?.textContent) {
      try {
        cached = JSON.parse(el.textContent);
      } catch {
        cached = null; // malformed payload must never break boot
      }
    }
  }

  return cached;
}
