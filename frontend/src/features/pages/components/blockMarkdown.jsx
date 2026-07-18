import { Link } from "react-router";

/** Minimal markdown → React elements for Text blocks.
 *
 * Deliberately NOT markdown → HTML. Everything here returns React nodes, so
 * there is no `dangerouslySetInnerHTML` anywhere on the block path and no
 * sanitising to get wrong. Page `content` still uses HTML (sanitised
 * server-side) because it comes from the rich-text editor; blocks never do.
 *
 * Supported, matching what the editor's hint promises: **bold**, *italic*,
 * [links](/path), `- ` / `* ` bullets, `1. ` numbers, and blank-line paragraphs.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

/** Only relative paths and http(s) become links — same rule the API enforces. */
function isSafeHref(href) {
  return /^(https?:\/\/|\/|#|mailto:)/i.test(href);
}

function renderInline(text, keyPrefix) {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={key} className="font-semibold text-ink">{bold[1]}</strong>;

    const italic = part.match(/^\*([^*]+)\*$/);
    if (italic) return <em key={key}>{italic[1]}</em>;

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      if (!isSafeHref(href)) return <span key={key}>{label}</span>;
      const cls = "font-semibold text-brand-deep hover:text-ink";
      return href.startsWith("/") ? (
        <Link key={key} to={href} className={cls}>{label}</Link>
      ) : (
        <a key={key} href={href} target="_blank" rel="noreferrer noopener" className={cls}>{label}</a>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

export function Markdown({ text, className }) {
  if (!text?.trim()) return null;

  // Blank lines separate blocks; consecutive bullet lines group into one list.
  const chunks = text.trim().split(/\n{2,}/);

  return (
    <div className={className}>
      {chunks.map((chunk, ci) => {
        const lines = chunk.split("\n");
        const bulleted = lines.every((l) => /^\s*[-*]\s+/.test(l));
        const numbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));

        if (bulleted || numbered) {
          const List = bulleted ? "ul" : "ol";
          return (
            <List key={ci} className={bulleted ? "ml-5 list-disc" : "ml-5 list-decimal"}>
              {lines.map((line, li) => (
                <li key={li}>{renderInline(line.replace(/^\s*(?:[-*]|\d+\.)\s+/, ""), `${ci}-${li}`)}</li>
              ))}
            </List>
          );
        }

        return (
          <p key={ci}>
            {lines.map((line, li) => (
              <span key={li}>
                {renderInline(line, `${ci}-${li}`)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
