/** kebab-case preview of the slug the server will generate from a title/name.
 *
 * Mirrors the backend's `utils/slugify.js`. It's a preview only — the server
 * derives the real slug on save, so the two must not drift; keep this the one
 * copy on the frontend rather than re-typing it per screen.
 */
export function slugify(value) {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
