import sanitizeHtml from "sanitize-html";

// Matches the tag set @tiptap/starter-kit actually produces — admin-authored
// rich text is still untrusted input (it renders via dangerouslySetInnerHTML
// on public pages), so this is deliberately not sanitize-html's full default
// allow-list. Shared by CMS pages and brand/category landing-page content —
// one allow-list, so the two surfaces can't drift apart.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "code", "pre", "blockquote", "hr",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "a",
];
const ALLOWED_ATTRIBUTES = { a: ["href", "target", "rel"] };

export function sanitizeRichContent(html) {
  return sanitizeHtml(html ?? "", { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRIBUTES });
}
