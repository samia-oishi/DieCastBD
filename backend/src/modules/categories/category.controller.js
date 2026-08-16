import { Category } from "./category.model.js";
import { sanitizeRichContent } from "../../utils/sanitizeContent.js";
import { Product } from "../products/product.model.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";

export const listActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  sendSuccess(res, { data: categories });
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

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory, sortOrder, content, faqs } = req.body;
  const slug = slugify(name);

  if (await Category.exists({ slug })) {
    throw ApiError.conflict("A category with this name already exists");
  }

  const category = await Category.create({ name, slug, description, parentCategory, sortOrder, content: sanitizeRichContent(content), faqs });
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
