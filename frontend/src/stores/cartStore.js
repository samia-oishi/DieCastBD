import { create } from "zustand";
import { persist } from "zustand/middleware";

// Guest cart only — once logged in, the server cart (features/cart/api) is
// authoritative and this store is drained via /cart/merge, not read from.
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { product (snapshot), qty }

      // Applied coupon (client-side preview) — persisted so the Cart page's
      // coupon carries into Checkout. { code, discount, type, value } | null.
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      clearCoupon: () => set({ coupon: null }),

      addItem: (product, qty = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product._id === product._id);
        const requestedQty = (existing?.qty ?? 0) + qty;
        const cappedQty = Math.min(requestedQty, product.availableStock);

        if (existing) {
          set({
            items: items.map((i) => (i.product._id === product._id ? { ...i, qty: cappedQty, product } : i)),
          });
        } else {
          set({ items: [...items, { product, qty: cappedQty }] });
        }
      },

      updateQty: (productId, qty) => {
        set({
          items: get()
            .items.map((i) => (i.product._id === productId ? { ...i, qty: Math.min(qty, i.product.availableStock) } : i))
            .filter((i) => i.qty > 0),
        });
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product._id !== productId) });
      },

      clear: () => set({ items: [] }),
    }),
    { name: "diecastbd-guest-cart" }
  )
);
