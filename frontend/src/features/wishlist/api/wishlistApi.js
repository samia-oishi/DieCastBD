import { api } from "@/lib/axios";

export async function listWishlist() {
  const { data } = await api.get("/wishlist");
  return data.data;
}

export async function addToWishlist(productId) {
  await api.post(`/wishlist/${productId}`);
}

export async function removeFromWishlist(productId) {
  await api.delete(`/wishlist/${productId}`);
}
