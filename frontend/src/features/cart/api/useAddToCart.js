import toast from "react-hot-toast";

import { useCart } from "./useCart";

/** Add-to-cart with stock enforcement + meaningful feedback. Never lets the cart
 * exceed availableStock, and tells the customer why when it can't add. Shared by
 * every "add" surface (cards, featured, PDP) so the behaviour is consistent. */
export function useAddToCart() {
  const { items, addItem } = useCart();

  return (product, qty = 1) => {
    const inCart = items.find((i) => i.product._id === product._id)?.qty ?? 0;
    const remaining = product.availableStock - inCart;

    if (remaining <= 0) {
      toast.error(
        product.availableStock <= 0
          ? "Out of stock"
          : `Only ${product.availableStock} in stock — you already have the max in your cart`
      );
      return false;
    }

    const add = Math.min(qty, remaining);
    addItem(product, add);

    if (add < qty) {
      toast(`Only ${remaining} more in stock — added ${add}`, { icon: "⚠️" });
    } else {
      toast.success(qty > 1 ? `Added ${qty} to cart` : "Added to cart");
    }
    return true;
  };
}
