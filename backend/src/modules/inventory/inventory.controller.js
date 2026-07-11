import { Product } from "../products/product.model.js";
import { InventoryLog } from "../inventoryLogs/inventoryLog.model.js";
import { RestockAlert } from "../restockAlerts/restockAlert.model.js";
import { LOW_STOCK_THRESHOLD } from "../../config/constants.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// The catalog is small (dozens of SKUs, not thousands), so computing/sorting/
// filtering on the availableStock virtual in JS after one query is simpler and
// just as fast as a $expr aggregation pipeline that duplicates the virtual's
// subtraction logic in Mongo query syntax.
export const listInventory = asyncHandler(async (req, res) => {
  const { page, limit, q, lowStockOnly } = req.query;
  const filter = {
    isDeleted: false,
    ...(q ? { $or: [{ title: { $regex: q.trim(), $options: "i" } }, { sku: { $regex: q.trim(), $options: "i" } }] } : {}),
  };

  let products = await Product.find(filter)
    .select("title sku thumbnail stock reservedStock status")
    .sort({ stock: 1 });

  // Waiting-list counts, not tied to the filtered/paginated set above — cheap
  // since the catalog is small (dozens of SKUs, see comment above).
  const alertCounts = await RestockAlert.aggregate([{ $group: { _id: "$product", count: { $sum: 1 } } }]);
  const alertCountByProduct = new Map(alertCounts.map((a) => [a._id.toString(), a.count]));

  products = products.map((p) => ({
    id: p._id,
    title: p.title,
    sku: p.sku,
    thumbnail: p.thumbnail,
    status: p.status,
    stock: p.stock,
    reservedStock: p.reservedStock,
    availableStock: p.availableStock,
    isLowStock: p.availableStock <= LOW_STOCK_THRESHOLD,
    restockAlertCount: alertCountByProduct.get(p._id.toString()) ?? 0,
  }));

  if (lowStockOnly) products = products.filter((p) => p.isLowStock);
  products.sort((a, b) => a.availableStock - b.availableStock);

  const total = products.length;
  const start = (page - 1) * limit;
  const pageItems = products.slice(start, start + limit);

  sendSuccess(res, {
    data: pageItems,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), lowStockThreshold: LOW_STOCK_THRESHOLD },
  });
});

export const getProductInventoryLogs = asyncHandler(async (req, res) => {
  const logs = await InventoryLog.find({ product: req.params.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("performedBy", "name")
    .populate("referenceOrder", "orderNumber");
  sendSuccess(res, { data: logs });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { type, quantityChange, reason } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  const newStock = product.stock + quantityChange;
  if (newStock < 0) throw ApiError.badRequest("Stock cannot go below 0");
  if (newStock < product.reservedStock) {
    throw ApiError.badRequest(
      `Stock cannot drop below ${product.reservedStock} units currently reserved by pending orders`
    );
  }

  product.stock = newStock;
  await product.save();

  await InventoryLog.create({
    product: product._id,
    type,
    quantityChange,
    reason,
    performedBy: req.user.id,
  });

  sendSuccess(res, {
    data: {
      id: product._id,
      stock: product.stock,
      reservedStock: product.reservedStock,
      availableStock: product.availableStock,
    },
    message: "Stock updated",
  });
});
