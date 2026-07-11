import { RestockAlert } from "./restockAlert.model.js";
import { Product } from "../products/product.model.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createRestockAlert = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) throw ApiError.notFound("Product not found");

  try {
    await RestockAlert.create({ product: product._id, contact: req.body.contact });
  } catch (err) {
    // Duplicate (product, contact) pair — already subscribed, treat as success
    // rather than surfacing a confusing "already exists" error to the customer.
    if (err.code !== 11000) throw err;
  }

  sendSuccess(res, { status: 201, message: "We'll let you know when this is back in stock" });
});

// Admin-only — surfaces the actual waiting contacts for a product (not just the
// count already on GET /admin/inventory) so an admin can manually reach phone
// subscribers, who are never auto-emailed. Sorted newest-first, still-waiting
// (notifiedAt: null) first, so the actionable ones are on top.
export const listRestockAlertsAdmin = asyncHandler(async (req, res) => {
  const alerts = await RestockAlert.find({ product: req.params.id }).sort({ notifiedAt: 1, createdAt: -1 });
  sendSuccess(res, { data: alerts });
});
