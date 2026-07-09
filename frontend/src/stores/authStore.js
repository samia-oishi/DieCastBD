import { create } from "zustand";

// Mirrors the useCurrentUser() query result for synchronous reads (route guards,
// axios interceptors) — always written from the query, never fetched independently.
export const useAuthStore = create((set) => ({
  status: "idle", // "idle" | "authenticated" | "unauthenticated"
  user: null,

  setSession: (user) => set({ status: "authenticated", user }),
  clearSession: () => set({ status: "unauthenticated", user: null }),
}));
