import { Product } from "./product.model.js";
import { effectivePrice } from "../../utils/pricing.js";
import { withComputedVirtuals } from "./product.view.js";
import { Brand } from "../brands/brand.model.js";
import { Category } from "../categories/category.model.js";
import { slugify } from "../../utils/slugify.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../utils/cloudinaryUpload.js";
import { AuditLog } from "../auditLogs/auditLog.model.js";

// Every sort ends with _id so the order is TOTAL, not just sorted-by-field.
// Mongo's sort is unstable for ties, and this catalogue has products sharing a
// price — with .skip()/.limit() a tie straddling a page boundary could
// reproducibly repeat one product on two pages and drop another entirely. That
// was invisible behind numbered pagination; infinite scroll would render it as
// a duplicate card.
const SORT_MAP = {
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: 1 },
  "title-asc": { title: 1, _id: 1 },
};

async function buildPublicFilter({
  brand,
  category,
  series,
  minPrice,
  maxPrice,
  inStock,
  featured,
  hero,
  newArrival,
  q,
}) {
  const filter = { status: "active", isDeleted: false };

  const [brandDoc, categoryDoc] = await Promise.all([
    brand ? Brand.findOne({ slug: brand }) : Promise.resolve(undefined),
    category ? Category.findOne({ slug: category }) : Promise.resolve(undefined),
  ]);
  if (brand) filter.brand = brandDoc?._id ?? null; // null slug match => intentionally empty result set
  if (category) filter.category = categoryDoc?._id ?? null;
  if (series) filter.series = series;
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = minPrice;
    if (maxPrice != null) filter.price.$lte = maxPrice;
  }
  // "In stock" must mean AVAILABLE stock (stock − reservedStock), matching the
  // storefront's own out-of-stock rule (ProductCard: availableStock <= 0). Raw
  // `stock > 0` would wrongly keep a fully-reserved item that the card shows as
  // "Out of stock". availableStock is a virtual (not stored), so filter via
  // $expr; $ifNull guards any legacy doc missing reservedStock.
  if (inStock) filter.$expr = { $gt: [{ $subtract: ["$stock", { $ifNull: ["$reservedStock", 0] }] }, 0] };
  if (featured) filter.isFeatured = true;
  if (hero) filter.isHeroProduct = true;
  if (newArrival) filter.isNewArrival = true;
  if (q) {
    // Case-insensitive substring search (matches partial input like a single
    // letter) across the customer-facing text fields — not MongoDB $text, which
    // only matches whole words. Special chars are escaped so input can't form an
    // invalid or injected regex.
    const escaped = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    filter.$or = [{ title: rx }, { sku: rx }, { series: rx }, { tags: rx }];
  }

  return filter;
}

export const listProducts = asyncHandler(async (req, res) => {
  const {
    brand,
    category,
    series,
    minPrice,
    maxPrice,
    inStock,
    featured,
    hero,
    newArrival,
    sort,
    q,
    page,
    limit,
  } = req.query;
  const filter = await buildPublicFilter({
    brand,
    category,
    series,
    minPrice,
    maxPrice,
    inStock,
    featured,
    hero,
    newArrival,
    q,
  });

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(SORT_MAP[sort])
      .skip(skip)
      .limit(limit)
      .populate("brand", "name slug")
      .populate("category", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: items.map(withComputedVirtuals),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getFilterOptions = asyncHandler(async (req, res) => {
  const baseFilter = { status: "active", isDeleted: false };

  const [series, priceRange] = await Promise.all([
    Product.distinct("series", { ...baseFilter, series: { $nin: [null, ""] } }),
    Product.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]),
  ]);

  sendSuccess(res, {
    data: {
      series: series.sort(),
      minPrice: priceRange[0]?.min ?? 0,
      maxPrice: priceRange[0]?.max ?? 0,
    },
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: "active", isDeleted: false })
    .populate("brand", "name slug")
    .populate("category", "name slug")
    .lean();
  if (!product) throw ApiError.notFound("Product not found");
  sendSuccess(res, { data: withComputedVirtuals(product) });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  // Internal-only lookup — its output is never sent to the client, only
  // ._id/.brand/.category are read below, so no virtuals are needed here.
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) throw ApiError.notFound("Product not found");

  const related = await Product.find({
    _id: { $ne: product._id },
    status: "active",
    isDeleted: false,
    $or: [{ brand: product.brand }, { category: { $in: product.category } }],
  })
    .limit(8)
    .populate("brand", "name slug")
    .lean();

  sendSuccess(res, { data: related.map(withComputedVirtuals) });
});

export const listProductsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, status, q, brand, category } = req.query;
  // The admin list honours status + search (the redesigned Products screen has
  // status chips and a search box); previously both were silently ignored here.
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (q) {
    // Same escaped case-insensitive substring search as the storefront list, but
    // scoped to the fields an admin scans by.
    const escaped = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    filter.$or = [{ title: rx }, { sku: rx }];
  }

  // Brand/category arrive as SLUGS (the admin Brands/Categories screens link
  // their product counts through by slug), so resolve them to ids first. A slug
  // that matches nothing filters to an empty set rather than being ignored.
  const [brandDoc, categoryDoc] = await Promise.all([
    brand ? Brand.findOne({ slug: brand }) : Promise.resolve(undefined),
    category ? Category.findOne({ slug: category }) : Promise.resolve(undefined),
  ]);
  if (brand) filter.brand = brandDoc?._id ?? null;
  if (category) filter.category = categoryDoc?._id ?? null;

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

// Bulk audit helper — the auditLog() middleware keys off a single :id, so bulk
// routes record per-entity rows here instead (same reasoning as deleteOrders).
async function auditProducts(req, products, before) {
  await AuditLog.insertMany(
    products.map((p) => ({
      actor: req.user?.id,
      action: `${req.method} ${req.originalUrl}`,
      entityType: "Product",
      entityId: p._id.toString(),
      before: before?.(p),
      after: null,
      ip: req.ip,
    }))
  ).catch((err) => console.error("Bulk audit write failed:", err.message));
}

export const bulkUpdateProductStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  const products = await Product.find({ _id: { $in: ids }, isDeleted: false });
  if (products.length === 0) throw ApiError.notFound("No matching products found");

  await auditProducts(req, products, (p) => ({ status: p.status }));
  await Product.updateMany({ _id: { $in: products.map((p) => p._id) } }, { $set: { status } });

  sendSuccess(res, {
    data: { updatedCount: products.length, status },
    message: `${products.length} product${products.length === 1 ? "" : "s"} set to ${status}`,
  });
});

export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  // Products soft-delete (isDeleted) — unlike orders they hold no reservedStock,
  // so there's no stock to return; a plain flag flip is correct.
  const products = await Product.find({ _id: { $in: ids }, isDeleted: false });
  if (products.length === 0) throw ApiError.notFound("No matching products found");

  await auditProducts(req, products, (p) => p.toObject());
  await Product.updateMany({ _id: { $in: products.map((p) => p._id) } }, { $set: { isDeleted: true } });

  sendSuccess(res, {
    data: { deletedCount: products.length },
    message: `${products.length} product${products.length === 1 ? "" : "s"} deleted`,
  });
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
