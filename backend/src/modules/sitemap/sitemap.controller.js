import { Product } from "../products/product.model.js";
import { Page } from "../pages/page.model.js";
import { Brand } from "../brands/brand.model.js";
import { Category } from "../categories/category.model.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Static, always-indexable public routes. Private routes (checkout, account,
// orders, admin) are intentionally excluded — they also carry X-Robots-Tag:
// noindex from frontend/vercel.json.
const STATIC_PATHS = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
];

// CMS pages live at /<slug>, a catch-all the router matches LAST — so a page
// slugged "shop" or "about" is shadowed by the real route and can never render.
// Emitting it would advertise a duplicate <loc> for a URL that shows different
// content, so drop it here. (createPage only checks slug uniqueness against
// other pages, not against the route table.)
const RESERVED_SLUGS = new Set([
  "shop", "products", "brand", "category", "cart", "checkout", "order-confirmation",
  "about", "contact", "faq", "login", "register", "forgot-password", "account",
  "wishlist", "orders", "admin", "unauthorized",
]);

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

  // Brand/category landing pages rank for "<collection> bangladesh" searches,
  // so they belong in the sitemap alongside products. Priority sits above
  // products because they're the entry points a search lands on first.
  const [brands, categories] = await Promise.all([
    Brand.find({ isActive: true }).select("slug updatedAt").lean(),
    Category.find({ isActive: true }).select("slug updatedAt").lean(),
  ]);

  const entries = [
    ...STATIC_PATHS.map((s) => urlEntry(`${base}${s.path}`, s)),
    ...products.map((p) =>
      urlEntry(`${base}/products/${p.slug}`, {
        lastmod: p.updatedAt?.toISOString().slice(0, 10),
        changefreq: "weekly",
        priority: "0.8",
      })
    ),
    ...brands.map((b) =>
      urlEntry(`${base}/brand/${b.slug}`, {
        lastmod: b.updatedAt?.toISOString().slice(0, 10),
        changefreq: "weekly",
        priority: "0.9",
      })
    ),
    ...categories.map((c) =>
      urlEntry(`${base}/category/${c.slug}`, {
        lastmod: c.updatedAt?.toISOString().slice(0, 10),
        changefreq: "weekly",
        priority: "0.9",
      })
    ),
    ...pages
      .filter((p) => !RESERVED_SLUGS.has(p.slug))
      .map((p) =>
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
