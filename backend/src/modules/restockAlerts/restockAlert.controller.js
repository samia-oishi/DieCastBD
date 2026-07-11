import { RestockAlert } from "./restockAlert.model.js";
import { Product } from "../products/product.model.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createRestockAlert = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) throw ApiError.notFound("Product not found");

  try {
    await RestockAlert.create({ product: product._id, email: req.body.email });
  } catch (err) {
    // Duplicate (product, email) pair — already subscribed, treat as success
    // rather than surfacing a confusing "already exists" error to the customer.
    if (err.code !== 11000) throw err;
  }

  sendSuccess(res, { status: 201, message: "We'll email you when this is back in stock" });
});
