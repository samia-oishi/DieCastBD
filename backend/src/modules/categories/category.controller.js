import { Category } from "./category.model.js";
import { sanitizeRichContent } from "../../utils/sanitizeContent.js";
import { Product } from "../products/product.model.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";
import { reorderByIds } from "../../utils/reorderByIds.js";

/** Every category, in merchant-chosen order. Same split as listPublicBrands:
 * `isActive` controls whether it is offered as a filter, not whether its page
 * exists (plan.md #109). `activeProductCount` lets the storefront noindex an
 * empty listing rather than serve a Soft 404. */
export const listPublicCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();

  const counts = await Product.aggregate([
    { $match: { status: "active", isDeleted: false } },
    { $unwind: "$category" }, // category is an ARRAY on Product, unlike brand
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));

  sendSuccess(res, {
    data: categories.map((c) => ({ ...c, activeProductCount: byId.get(String(c._id)) ?? 0 })),
  });
});

export const listAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();

  // Product counts for the admin list. `category` is an ARRAY on Product, so it
  // unwinds before grouping (unlike brand, which is a single ref).
  const counts = await Product.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: "$category" },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((x) => [String(x._id), x.count]));

  sendSuccess(res, {
    data: categories.map((x) => ({ ...x, productCount: byId.get(String(x._id)) ?? 0 })),
  });
});

/** Same as reorderBrands — the merchant's running order, densely stored. */
export const reorderCategories = asyncHandler(async (req, res) => {
  const moved = await reorderByIds(Category, req.body.ids);
  sendSuccess(res, { message: `Order saved (${moved} updated)` });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory, sortOrder, content, faqs } = req.body;
  const slug = slugify(name);

  if (await Category.exists({ slug })) {
    throw ApiError.conflict("A category with this name already exists");
  }

  // Appended to the merchant's order, same reasoning as createBrand.
  const position = sortOrder ?? ((await Category.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean())?.sortOrder ?? -1) + 1;

  const category = await Category.create({ name, slug, description, parentCategory, sortOrder: position, content: sanitizeRichContent(content), faqs });
  sendSuccess(res, { data: category, status: 201, message: "Category created" });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  // Landing-page content renders via dangerouslySetInnerHTML on the storefront.
  if (updates.content !== undefined) updates.content = sanitizeRichContent(updates.content);

  // Immutable after creation (plan.md #90) — same reasoning as brands:
  // /category/<slug> is an indexed landing page, and a rename had no redirect.
  delete updates.slug;

  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!category) throw ApiError.notFound("Category not found");
  sendSuccess(res, { data: category, message: "Category updated" });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ category: req.params.id });
  if (inUse) {
    throw ApiError.conflict("Cannot delete a category that still has products — reassign or delete them first");
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  await deleteFromCloudinary(category.image?.cloudinaryId);
  sendSuccess(res, { message: "Category deleted" });
});

export const uploadCategoryImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No image file provided");

  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  const previousImageId = category.image?.cloudinaryId;
  category.image = await uploadBufferToCloudinary(req.file.buffer, "categories");
  await category.save();
  await deleteFromCloudinary(previousImageId);

  sendSuccess(res, { data: category, message: "Image uploaded" });
});
