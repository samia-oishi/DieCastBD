import sanitizeHtml from "sanitize-html";
import { Page } from "./page.model.js";
import { Product } from "../products/product.model.js";
import { PUBLIC_CARD_FIELDS, withComputedVirtuals } from "../products/product.view.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Matches the tag set @tiptap/starter-kit actually produces — admin-authored
// rich text is still untrusted input (this renders via dangerouslySetInnerHTML
// on the public page), so this is deliberately not sanitize-html's full default
// allow-list.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "code", "pre", "blockquote", "hr",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "a",
];
const ALLOWED_ATTRIBUTES = { a: ["href", "target", "rel"] };

function sanitizePageContent(html) {
  return sanitizeHtml(html ?? "", { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRIBUTES });
}

/** Products referenced by a page's blocks, resolved server-side.
 *
 * Product and carousel blocks store slugs, not embedded product data — so a
 * price edit shows up on every page that features the product instead of
 * freezing at whatever it was when the block was built. Resolving here keeps a
 * public page one request rather than making the browser fetch the catalogue
 * and filter it client-side.
 */
async function resolveBlockProducts(blocks = []) {
  const slugs = new Set();
  let wantsFeatured = false;

  for (const block of blocks) {
    if (block?.type === "products" && block.featured) wantsFeatured = true;
    if (block?.type === "products" || block?.type === "carousel") {
      for (const slug of block.picked ?? []) slugs.add(slug);
    }
  }
  if (!slugs.size && !wantsFeatured) return [];

  const query = wantsFeatured
    ? { $or: [{ slug: { $in: [...slugs] } }, { isFeatured: true }] }
    : { slug: { $in: [...slugs] } };

  // Only active products — a block must not resurrect something the merchant
  // drafted or archived after building the page.
  //
  // The same projection and virtual-recompute the public product routes use.
  // Leaning without withComputedVirtuals left availableStock undefined, and
  // `undefined <= 0` is false, so an out-of-stock product rendered on a block
  // page as buyable, complete with an add-to-cart button.
  const products = await Product.find({ ...query, status: "active" })
    .select(PUBLIC_CARD_FIELDS)
    .populate("brand", "name slug")
    .lean();

  return products.map(withComputedVirtuals);
}

export const getPageBySlug = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, isPublished: true }).lean();
  if (!page) throw ApiError.notFound("Page not found");

  const products = await resolveBlockProducts(page.blocks);
  sendSuccess(res, { data: { ...page, blockProducts: products } });
});

export const listPagesAdmin = asyncHandler(async (req, res) => {
  const pages = await Page.find().sort({ title: 1 });
  sendSuccess(res, { data: pages });
});

export const getPageAdmin = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) throw ApiError.notFound("Page not found");
  sendSuccess(res, { data: page });
});

export const createPage = asyncHandler(async (req, res) => {
  const { title, content, tldr, blocks, seo, isPublished } = req.body;
  const slug = slugify(title);

  if (await Page.exists({ slug })) {
    throw ApiError.conflict("A page with this title already exists");
  }

  const page = await Page.create({ title, slug, content: sanitizePageContent(content), tldr, blocks, seo, isPublished });
  sendSuccess(res, { data: page, status: 201, message: "Page created" });
});

export const updatePage = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.title) updates.slug = slugify(updates.title);
  if (updates.content !== undefined) updates.content = sanitizePageContent(updates.content);

  const page = await Page.findByIdAndUpdate(req.params.id, updates, { returnDocument: "after", runValidators: true });
  if (!page) throw ApiError.notFound("Page not found");
  sendSuccess(res, { data: page, message: "Page updated" });
});

/** Pages the storefront routes to directly.
 *
 * `/terms-conditions` and friends are hardcoded routes with footer links, so
 * deleting one wouldn't just remove content — it would turn a linked page into
 * a 404. The merchant can empty them instead, which is what an unpublished or
 * blank policy page already renders.
 */
const SYSTEM_PAGE_SLUGS = new Set(["terms-conditions", "privacy-policy", "refund-policy", "shipping-policy"]);

export const deletePage = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) throw ApiError.notFound("Page not found");

  if (SYSTEM_PAGE_SLUGS.has(page.slug)) {
    throw ApiError.conflict(
      "The storefront links to this page from its footer — unpublish or clear it instead of deleting it"
    );
  }

  await page.deleteOne();
  sendSuccess(res, { message: `${page.title} deleted` });
});
