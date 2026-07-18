import { Product } from "../products/product.model.js";
import { Page } from "../pages/page.model.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Static, always-indexable public routes. Private routes (checkout, account,
// orders, admin) are intentionally excluded — they're also Disallow'd in robots.txt.
const STATIC_PATHS = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
];

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

export const getSitemap = asyncHandler(async (req, res) => {
  const base = env.CLIENT_URL.replace(/\/$/, "");

  const products = await Product.find({ status: "active", isDeleted: false })
    .select("slug updatedAt")
    .lean();

  // Published CMS pages — the four policies plus anything built in the block
  // builder. Unpublished drafts stay out, same as draft products.
  const pages = await Page.find({ isPublished: true }).select("slug updatedAt").lean();

  const entries = [
    ...STATIC_PATHS.map((s) => urlEntry(`${base}${s.path}`, s)),
    ...products.map((p) =>
      urlEntry(`${base}/products/${p.slug}`, {
        lastmod: p.updatedAt?.toISOString().slice(0, 10),
        changefreq: "weekly",
        priority: "0.8",
      })
    ),
    ...pages.map((p) =>
      urlEntry(`${base}/${p.slug}`, {
        lastmod: p.updatedAt?.toISOString().slice(0, 10),
        changefreq: "monthly",
        priority: "0.6",
      })
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=3600"); // hourly; product set changes slowly
  res.send(xml);
});
