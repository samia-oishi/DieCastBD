import { Brand } from "./brand.model.js";
import { Product } from "../products/product.model.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";

export const listActiveBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  sendSuccess(res, { data: brands });
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

export const createBrand = asyncHandler(async (req, res) => {
  const { name, description, sortOrder } = req.body;
  const slug = slugify(name);

  if (await Brand.exists({ slug })) {
    throw ApiError.conflict("A brand with this name already exists");
  }

  const brand = await Brand.create({ name, slug, description, sortOrder });
  sendSuccess(res, { data: brand, status: 201, message: "Brand created" });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.name) updates.slug = slugify(updates.name);

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
