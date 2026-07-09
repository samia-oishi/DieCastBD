import { Category } from "./category.model.js";
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
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  sendSuccess(res, { data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory, sortOrder } = req.body;
  const slug = slugify(name);

  if (await Category.exists({ slug })) {
    throw ApiError.conflict("A category with this name already exists");
  }

  const category = await Category.create({ name, slug, description, parentCategory, sortOrder });
  sendSuccess(res, { data: category, status: 201, message: "Category created" });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.name) updates.slug = slugify(updates.name);

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
