import { Product } from "./product.model.js";
import { Brand } from "../brands/brand.model.js";
import { Category } from "../categories/category.model.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";

const SORT_MAP = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "title-asc": { title: 1 },
};

async function buildPublicFilter({ brand, category, minPrice, maxPrice, inStock, q }) {
  const filter = { status: "active", isDeleted: false };

  if (brand) {
    const brandDoc = await Brand.findOne({ slug: brand });
    filter.brand = brandDoc?._id ?? null; // null slug match => intentionally empty result set
  }
  if (category) {
    const categoryDoc = await Category.findOne({ slug: category });
    filter.category = categoryDoc?._id ?? null;
  }
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = minPrice;
    if (maxPrice != null) filter.price.$lte = maxPrice;
  }
  if (inStock) filter.stock = { $gt: 0 };
  if (q) filter.$text = { $search: q };

  return filter;
}

export const listProducts = asyncHandler(async (req, res) => {
  const { brand, category, minPrice, maxPrice, inStock, sort, q, page, limit } = req.query;
  const filter = await buildPublicFilter({ brand, category, minPrice, maxPrice, inStock, q });

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(SORT_MAP[sort])
      .skip(skip)
      .limit(limit)
      .populate("brand", "name slug")
      .populate("category", "name slug"),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: "active", isDeleted: false })
    .populate("brand", "name slug")
    .populate("category", "name slug");
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, { data: product });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) throw ApiError.notFound("Product not found");

  const related = await Product.find({
    _id: { $ne: product._id },
    status: "active",
    isDeleted: false,
    $or: [{ brand: product.brand }, { category: { $in: product.category } }],
  })
    .limit(8)
    .populate("brand", "name slug");

  sendSuccess(res, { data: related });
});

export const listProductsAdmin = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const filter = { isDeleted: false };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter)
      .select("+costPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("brand", "name slug")
      .populate("category", "name slug"),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getProductAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("+costPrice");
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, { data: product });
});

async function uniqueSlugFromTitle(title, excludeId) {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

export const createProduct = asyncHandler(async (req, res) => {
  const { sku, title } = req.body;

  if (await Product.exists({ sku: sku.toUpperCase() })) {
    throw ApiError.conflict(`SKU ${sku} already exists`);
  }
  if (!(await Brand.exists({ _id: req.body.brand }))) {
    throw ApiError.badRequest("Brand does not exist");
  }

  const slug = await uniqueSlugFromTitle(title);
  const product = await Product.create({ ...req.body, slug });
  sendSuccess(res, { data: product, status: 201, message: "Product created" });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.sku) {
    const exists = await Product.exists({ sku: updates.sku.toUpperCase(), _id: { $ne: req.params.id } });
    if (exists) throw ApiError.conflict(`SKU ${updates.sku} already exists`);
  }
  if (updates.title) {
    updates.slug = await uniqueSlugFromTitle(updates.title, req.params.id);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  }).select("+costPrice");
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, { data: product, message: "Product updated" });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isDeleted: true }, { returnDocument: "after" });
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, { message: "Product deleted" });
});

export const uploadThumbnail = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No image file provided");

  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  const previousId = product.thumbnail?.cloudinaryId;
  product.thumbnail = await uploadBufferToCloudinary(req.file.buffer, "products");
  await product.save();
  await deleteFromCloudinary(previousId);

  sendSuccess(res, { data: product, message: "Thumbnail uploaded" });
});

export const addGalleryImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest("No image files provided");

  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  const uploaded = await Promise.all(
    req.files.map((file) => uploadBufferToCloudinary(file.buffer, "products"))
  );
  product.gallery.push(...uploaded);
  await product.save();

  sendSuccess(res, { data: product, message: "Gallery images added" });
});

export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  const [removed] = product.gallery.splice(req.params.index, 1);
  if (!removed) throw ApiError.notFound("Gallery image not found at that index");

  await product.save();
  await deleteFromCloudinary(removed.cloudinaryId);

  sendSuccess(res, { data: product, message: "Gallery image removed" });
});
