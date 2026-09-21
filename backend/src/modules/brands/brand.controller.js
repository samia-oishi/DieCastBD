import { Brand } from "./brand.model.js";
import { sanitizeRichContent } from "../../utils/sanitizeContent.js";
import { Product } from "../products/product.model.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";
import { reorderByIds } from "../../utils/reorderByIds.js";

/** Every brand, in merchant-chosen order — NOT just the active ones.
 *
 * `isActive` used to gate this list, which meant deactivating a brand also
 * deleted its page: CollectionPage looks a brand up here, found nothing, and
 * rendered "Page not found" behind an HTTP 200 — a Soft 404 (plan.md #109).
 * The two concerns are now separate: `isActive` means "offer it as a shop
 * filter", while the PAGE exists for as long as the brand does. Consumers that
 * are navigation (FilterSidebar, the homepage shelf) filter on isActive
 * themselves; consumers that resolve a URL use the whole list.
 *
 * `activeProductCount` rides along so the storefront can tell an empty brand
 * page from a stocked one and mark the empty one noindex, since an empty
 * listing is a Soft 404 in its own right.
 */
export const listPublicBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ sortOrder: 1, name: 1 }).lean();

  const counts = await Product.aggregate([
    { $match: { status: "active", isDeleted: false } },
    { $group: { _id: "$brand", count: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));

  sendSuccess(res, {
    data: brands.map((b) => ({ ...b, activeProductCount: byId.get(String(b._id)) ?? 0 })),
  });
});

export const listAllBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ sortOrder: 1, name: 1 }).lean();

  // Product counts for the admin list (the design links each count through to a
  // filtered Products view). One grouped count, not one query per row.
  const counts = await Product.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$brand", count: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));

  sendSuccess(res, {
    data: brands.map((x) => ({ ...x, productCount: byId.get(String(x._id)) ?? 0 })),
  });
});

/** The merchant's own running order for the brand lists, saved as one dense
 * `sortOrder` sequence. See utils/reorderByIds.js. */
export const reorderBrands = asyncHandler(async (req, res) => {
  const moved = await reorderByIds(Brand, req.body.ids);
  sendSuccess(res, { message: `Order saved (${moved} updated)` });
});

export const createBrand = asyncHandler(async (req, res) => {
  const { name, description, sortOrder, content, faqs } = req.body;
  const slug = slugify(name);

  if (await Brand.exists({ slug })) {
    throw ApiError.conflict("A brand with this name already exists");
  }

  // A new brand lands at the END of the merchant's order rather than tying for
  // first place at sortOrder 0 — the admin list is dragged into order, so a new
  // row appearing in the middle of it would be a surprise.
  const position = sortOrder ?? ((await Brand.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean())?.sortOrder ?? -1) + 1;

  const brand = await Brand.create({ name, slug, description, sortOrder: position, content: sanitizeRichContent(content), faqs });
  sendSuccess(res, { data: brand, status: 201, message: "Brand created" });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  // Landing-page content renders via dangerouslySetInnerHTML on the storefront.
  if (updates.content !== undefined) updates.content = sanitizeRichContent(updates.content);

  // Immutable after creation (plan.md #90). /brand/<slug> is an indexable
  // landing page — sitemap priority 0.9, above products — so renaming a brand
  // used to orphan a top-ranking URL with no redirect. The display name is free
  // to change; only the URL is frozen.
  delete updates.slug;

  const brand = await Brand.findByIdAndUpdate(req.params.id, updates, { returnDocument: "after", runValidators: true });
  if (!brand) throw ApiError.notFound("Brand not found");
  sendSuccess(res, { data: brand, message: "Brand updated" });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ brand: req.params.id });
  if (inUse) throw ApiError.conflict("Cannot delete a brand that still has products — reassign or delete them first");

  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) throw ApiError.notFound("Brand not found");

  await deleteFromCloudinary(brand.logo?.cloudinaryId);
  sendSuccess(res, { message: "Brand deleted" });
});

export const uploadBrandLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No image file provided");

  const brand = await Brand.findById(req.params.id);
  if (!brand) throw ApiError.notFound("Brand not found");

  const previousLogoId = brand.logo?.cloudinaryId;
  brand.logo = await uploadBufferToCloudinary(req.file.buffer, "brands");
  await brand.save();
  await deleteFromCloudinary(previousLogoId);

  sendSuccess(res, { data: brand, message: "Logo uploaded" });
});
