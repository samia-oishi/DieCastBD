import { Cart } from "./cart.model.js";
import { Product } from "../products/product.model.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { effectivePrice } from "../../utils/pricing.js";

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function findActiveProduct(productId) {
  const product = await Product.findOne({ _id: productId, status: "active", isDeleted: false });
  if (!product) throw ApiError.notFound("Product not found or no longer available");
  return product;
}

/** Populates live product data, computes totals from CURRENT price (not the
 * stored snapshot — a cart is pre-purchase browsing state, so totals should
 * reflect reality, not what the price was when the item was added), and
 * flags items where stock has dropped below the cart quantity since. */
async function serializeCart(cart) {
  const populated = await cart.populate({
    path: "items.product",
    // paymentOptions/advancePaymentPercent are needed client-side (CheckoutPage)
    // to compute which order-level paymentOption is available/COD-disabled
    // before submitting — server-side assertPaymentMethodAllowed is still the
    // authoritative check, this is just so the UI doesn't guess.
    select:
      "title slug thumbnail price salePrice stock reservedStock status isDeleted paymentOptions advancePaymentPercent",
  });

  const items = populated.items
    .filter((item) => item.product && item.product.status === "active" && !item.product.isDeleted)
    .map((item) => {
      const product = item.product;
      const availableStock = product.stock - product.reservedStock;
      const currentPrice = effectivePrice(product);
      return {
        product,
        qty: item.qty,
        priceSnapshot: item.priceSnapshot,
        priceChanged: item.priceSnapshot !== currentPrice,
        lineTotal: currentPrice * item.qty,
        stockIssue: availableStock < item.qty ? { availableStock } : null,
      };
    });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return { items, subtotal, itemCount };
}

export const getMyCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  sendSuccess(res, { data: await serializeCart(cart) });
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, qty } = req.body;
  const product = await findActiveProduct(productId);

  const cart = await getOrCreateCart(req.user.id);
  const existing = cart.items.find((item) => item.product.toString() === productId);
  const requestedQty = (existing?.qty ?? 0) + qty;
  const availableStock = product.stock - product.reservedStock;

  if (requestedQty > availableStock) {
    throw ApiError.conflict(
      availableStock > 0 ? `Only ${availableStock} left in stock` : "This item is out of stock"
    );
  }

  const price = effectivePrice(product);
  if (existing) {
    existing.qty = requestedQty;
    existing.priceSnapshot = price;
  } else {
    cart.items.push({ product: productId, qty, priceSnapshot: price });
  }

  await cart.save();
  sendSuccess(res, { data: await serializeCart(cart), message: "Added to cart" });
});

export const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { qty } = req.body;
  const product = await findActiveProduct(productId);
  const availableStock = product.stock - product.reservedStock;

  if (qty > availableStock) {
    throw ApiError.conflict(
      availableStock > 0 ? `Only ${availableStock} left in stock` : "This item is out of stock"
    );
  }

  const cart = await getOrCreateCart(req.user.id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw ApiError.notFound("Item not in cart");

  item.qty = qty;
  await cart.save();
  sendSuccess(res, { data: await serializeCart(cart), message: "Cart updated" });
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();
  sendSuccess(res, { data: await serializeCart(cart), message: "Item removed" });
});

export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);

  for (const { productId, qty } of req.body.items) {
    const product = await Product.findOne({ _id: productId, status: "active", isDeleted: false });
    if (!product) continue; // guest cart may reference a product removed since — skip silently

    const availableStock = product.stock - product.reservedStock;
    const existing = cart.items.find((item) => item.product.toString() === productId);
    const mergedQty = Math.min((existing?.qty ?? 0) + qty, Math.max(availableStock, 0));

    if (mergedQty <= 0) continue;

    const price = effectivePrice(product);
    if (existing) {
      existing.qty = mergedQty;
      existing.priceSnapshot = price;
    } else {
      cart.items.push({ product: productId, qty: mergedQty, priceSnapshot: price });
    }
  }

  await cart.save();
  sendSuccess(res, { data: await serializeCart(cart), message: "Cart merged" });
});
