import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 10;

// Stores a lightweight product snapshot (not just an id) so the "Recently
// Viewed" section renders instantly with no extra fetch — acceptable staleness
// tradeoff for a convenience section, same pattern most storefronts use.
export const useRecentlyViewedStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => ({
          items: [product, ...state.items.filter((p) => p._id !== product._id)].slice(0, MAX_ITEMS),
        })),
    }),
    { name: "diecastbd-recently-viewed" }
  )
);
