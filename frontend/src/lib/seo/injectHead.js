/** Pure string transform: take the built SPA shell and a head model from
 * lib/seo/routes.js, return HTML whose <head> describes THAT route.
 *
 * WHY string surgery and not a DOM library: this runs in the build, where the
 * only job is producing bytes. A parser would add a dependency, reformat the
 * authored shell, and buy nothing — we are replacing a known, small set of tags
 * by key, not editing arbitrary markup.
 *
 * WHY tags are REMOVED before the new ones are appended: index.html ships
 * static fallback SEO tags for JS-blind crawlers. Appending without removing
 * leaves two <title>s and two descriptions in the served HTML, and a crawler
 * may read the generic one first.
 *
 * WHY every injected tag carries data-prerendered: react-helmet-async v3 on
 * React 19 APPENDS its tags rather than replacing what is already in <head>.
 * main.jsx removes [data-prerendered] before the first render, so the baked
 * head serves JS-blind crawlers and React's live head serves everyone else —
 * never both at once. Drop that strip and every page ships duplicate canonicals
 * and duplicate Product JSON-LD.
 */

const MARKER = "data-prerendered";

/** Escape a value for use inside a double-quoted HTML attribute. `>` is escaped
 * too so the tag scanners below can never be fooled by injected content. */
export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape for text content between tags (used for <title>). */
export function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** `</script>` inside a JSON payload would close the tag early; escaping the
 * angle bracket keeps it inert to the HTML parser while staying valid JSON. */
export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Stable identity for a head tag, so an injected tag can replace the static
 * one it supersedes. Returns null for tags we never touch. */
export function tagKey(tag) {
  if (/^<title\b/i.test(tag)) return "title";
  if (/^<meta\b/i.test(tag)) {
    const name = tag.match(/\bname\s*=\s*"([^"]*)"/i);
    if (name) return `meta:name:${name[1].toLowerCase()}`;
    const prop = tag.match(/\bproperty\s*=\s*"([^"]*)"/i);
    if (prop) return `meta:prop:${prop[1].toLowerCase()}`;
    return null;
  }
  if (/^<link\b/i.test(tag)) {
    const rel = tag.match(/\brel\s*=\s*"([^"]*)"/i);
    if (rel && rel[1].toLowerCase() === "canonical") return "link:canonical";
    return null;
  }
  return null;
}

/** The head model → a list of { key, html } tags, in the order they'll appear.
 * `key` is null for tags that only ever add (JSON-LD), never replace. */
export function buildHeadTags(model) {
  const tags = [];
  const meta = (attr, value, content) => ({
    key: `meta:${attr === "name" ? "name" : "prop"}:${value.toLowerCase()}`,
    html: `<meta ${attr}="${escapeAttr(value)}" content="${escapeAttr(content)}" ${MARKER}="1">`,
  });

  if (model.title) {
    tags.push({ key: "title", html: `<title ${MARKER}="1">${escapeText(model.title)}</title>` });
    tags.push(meta("property", "og:title", model.title));
  }
  if (model.description) {
    tags.push(meta("name", "description", model.description));
    tags.push(meta("property", "og:description", model.description));
  }
  if (model.canonical) {
    tags.push({
      key: "link:canonical",
      html: `<link rel="canonical" href="${escapeAttr(model.canonical)}" ${MARKER}="1">`,
    });
  }
  if (model.ogUrl) tags.push(meta("property", "og:url", model.ogUrl));
  if (model.ogType) tags.push(meta("property", "og:type", model.ogType));
  // Only override the shell's static share image when this route has a real one
  // of its own — otherwise the /share-image fallback must survive for the
  // social crawlers it exists to serve.
  if (model.image) {
    tags.push(meta("property", "og:image", model.image));
    tags.push(meta("name", "twitter:image", model.image));
  }
  for (const extra of model.extraMeta ?? []) {
    if (extra.name) tags.push(meta("name", extra.name, extra.content));
    else if (extra.property) tags.push(meta("property", extra.property, extra.content));
  }
  for (const block of model.jsonLd ?? []) {
    if (!block) continue;
    tags.push({
      key: null,
      html: `<script type="application/ld+json" ${MARKER}="1">${serializeJsonLd(block)}</script>`,
    });
  }
  return tags;
}

/** Remove every tag in `head` whose key is in `keys`. */
function removeSupersededTags(head, keys) {
  const scanner = /<title\b[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*>/gi;
  return head.replace(scanner, (tag) => {
    const key = tagKey(tag);
    return key && keys.has(key) ? "" : tag;
  });
}

/**
 * @param {string} shellHtml  the built dist/index.html, untouched
 * @param {object} model      a head model from lib/seo/routes.js
 * @param {string} [extraHtml] raw HTML appended inside <head> (hero preload,
 *                             the __SETTINGS__ bootstrap payload)
 */
/** Replace the empty SPA mount point with prerendered body HTML.
 *
 * Used only for routes whose raw-HTML BODY matters to crawlers (the
 * /collections link hub, and collection landing pages). The injected content
 * is deliberately NOT tagged data-prerendered: createRoot's first commit
 * replaces #root's children wholesale, so the baked content shows until React
 * paints and is then superseded — tagging it would make main.jsx strip it at
 * JS boot and leave a blank gap instead.
 */
export function injectRoot(shellHtml, bodyHtml) {
  const marker = /<div id="root">\s*<\/div>/;
  if (!marker.test(shellHtml)) throw new Error('shell has no empty <div id="root"> — refusing to inject body');
  return shellHtml.replace(marker, `<div id="root">${bodyHtml}</div>`);
}

export function injectHead(shellHtml, model, extraHtml = "") {
  const headMatch = shellHtml.match(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i);
  if (!headMatch) throw new Error("shell has no <head> — refusing to inject");
  const [whole, open, inner, close] = headMatch;

  const tags = buildHeadTags(model);
  const keys = new Set(tags.map((t) => t.key).filter(Boolean));

  const cleaned = removeSupersededTags(inner, keys).replace(/\s*$/, "\n");
  const block = tags.map((t) => `    ${t.html}`).join("\n");
  const nextHead = `${cleaned}${block}\n${extraHtml ? `    ${extraHtml}\n` : ""}  `;

  return shellHtml.slice(0, headMatch.index) + open + nextHead + close + shellHtml.slice(headMatch.index + whole.length);
}
