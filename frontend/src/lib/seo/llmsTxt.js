/** /llms.txt — the shop, stated plainly enough for an assistant to quote.
 *
 * WHY: an AI assistant answering "where can I buy Hot Wheels in Bangladesh"
 * does not rank pages, it extracts facts. It needs the answers — what is sold,
 * what it costs, who delivers where, how you pay, whether returns exist — as
 * flat statements rather than spread across a rendered storefront. This is that
 * file, in the llmstxt.org convention: one markdown page linking to the rest.
 *
 * WHY generated rather than hand-written in public/: every number here is real
 * and comes from the same API the storefront reads at build time, so it cannot
 * quietly drift from the catalogue the way a static copy would. Nothing in it
 * is composed prose about the business — the description is the merchant's own
 * SEO description, the fees and delivery times are their shipping zones, the
 * return window is their setting (#11: never invent, omit instead).
 *
 * Cost: none. It is a static file on the CDN, which matters because this was
 * written the same week Vercel Active CPU hit its ceiling.
 *
 * Plain Node imports this — no JSX, no @/ aliases, no import.meta.env.
 */
import { formatTaka } from "../currency.js";
import { SITE_NAME } from "./constants.js";
import { collectionCopy } from "./collectionCopy.js";
import { asLinkableCollections } from "../collectionVisibility.js";

const line = (label, value) => (value ? `- **${label}:** ${value}\n` : "");

/** How the shop takes money. COD is the standing offer; bKash appears only once
 * the merchant has actually configured a merchant number. */
function paymentLine(settings) {
  const methods = ["Cash on delivery"];
  if (settings?.bkashConfig?.merchantNumber) methods.push("bKash (manual, confirmed before dispatch)");
  return methods.join(" · ");
}

function deliveryLines(settings) {
  const zones = (settings?.shippingZones ?? []).filter((z) => z?.name);
  if (!zones.length) return "";
  return zones
    .map((z) => `- ${z.name}: ${formatTaka(Number(z.fee) || 0)}${z.eta ? ` — ${z.eta}` : ""}\n`)
    .join("");
}

function section(title, rows) {
  if (!rows.length) return "";
  return `\n## ${title}\n\n${rows.join("")}`;
}

export function renderLlmsTxt({ settings, brands = [], categories = [], products = [], guides = [], siteUrl }) {
  const base = siteUrl.replace(/\/$/, "");
  const contact = settings?.contactInfo ?? {};
  const social = settings?.socialLinks ?? {};
  const returnDays = Number(settings?.seoDefaults?.returnWindowDays);
  const description = settings?.seoDefaults?.description;

  // The same rule the /collections hub and the sitemap use — stocked, and not
  // one of the slugs the edge redirects away. A local copy of this filter is
  // how /category/hot-wheels ended up advertised here while 301ing.
  const collectionRows = [
    ...asLinkableCollections(brands).map((b) => ({ kind: "brand", c: b })),
    ...asLinkableCollections(categories).map((c) => ({ kind: "category", c })),
  ].map(({ kind, c }) => {
    const copy = collectionCopy(c.slug, c);
    const count = c.activeProductCount;
    return `- [${copy.title}](${base}/${kind}/${c.slug})${count ? ` — ${count} in stock` : ""}\n`;
  });

  const productRows = products.map((p) => {
    const onSale = p.salePrice > 0 && p.salePrice < p.price;
    const price = onSale ? p.salePrice : p.price;
    const stock = (p.availableStock ?? 0) > 0 ? "in stock" : "out of stock";
    return `- [${p.title}](${base}/products/${p.slug}) — ${formatTaka(price)} — ${stock}\n`;
  });

  const guideRows = guides.map((g) => `- [${g.title}](${base}/${g.slug})\n`);

  return (
    `# ${SITE_NAME}\n\n` +
    (description ? `> ${description}\n\n` : "") +
    `${SITE_NAME} is an online diecast shop serving Bangladesh. Orders are placed at ${base} and delivered nationwide.\n` +
    `\n## Ordering\n\n` +
    line("Payment", paymentLine(settings)) +
    line("Returns", returnDays > 0 ? `${returnDays} days` : "") +
    line("Currency", "Bangladeshi taka (BDT, ৳)") +
    line("Email", contact.email) +
    line("Phone", contact.phone) +
    line("WhatsApp", social.whatsapp) +
    line("Address", contact.address) +
    (deliveryLines(settings) ? `\n### Delivery\n\n${deliveryLines(settings)}` : "") +
    section("Collections", collectionRows) +
    section("Guides", guideRows) +
    section("Products", productRows) +
    `\n## More\n\n` +
    `- [Shop, with filters and sorting](${base}/shop)\n` +
    `- [Every collection and product on one page](${base}/collections)\n` +
    `- [Frequently asked questions](${base}/faq)\n` +
    `- [About](${base}/about) · [Contact](${base}/contact)\n`
  );
}
