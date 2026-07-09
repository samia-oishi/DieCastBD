import { Wishlist } from "./wishlist.model.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const listMyWishlist = asyncHandler(async (req, res) => {
  const entries = await Wishlist.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: "product",
      populate: [
        { path: "brand", select: "name slug" },
        { path: "category", select: "name slug" },
      ],
    });

  // Wishlisting a product that's later soft-deleted shouldn't surface a null entry.
  const products = entries.map((e) => e.product).filter(Boolean);
  sendSuccess(res, { data: products });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  await Wishlist.findOneAndUpdate(
    { user: req.user.id, product: req.params.productId },
    { user: req.user.id, product: req.params.productId },
    { upsert: true, setDefaultsOnInsert: true }
  );
  sendSuccess(res, { message: "Added to wishlist" });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.deleteOne({ user: req.user.id, product: req.params.productId });
  sendSuccess(res, { message: "Removed from wishlist" });
});
