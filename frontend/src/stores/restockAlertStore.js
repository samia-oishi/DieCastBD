import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Tracks which products the visitor has already subscribed a restock alert to,
 * so the card button can read "✓ Alert set" across reloads. Client-only UI hint
 * (the backend is the source of truth for the actual subscription). */
export const useRestockAlertStore = create(
  persist(
    (set, get) => ({
      alertedIds: [],
      isAlerted: (productId) => get().alertedIds.includes(productId),
      markAlerted: (productId) =>
        set((s) => (s.alertedIds.includes(productId) ? s : { alertedIds: [...s.alertedIds, productId] })),
    }),
    { name: "diecastbd-restock-alerts" }
  )
);
