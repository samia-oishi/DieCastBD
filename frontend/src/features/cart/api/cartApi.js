import { api } from "@/lib/axios";

export async function getCart() {
  const { data } = await api.get("/cart");
  return data.data;
}

export async function addCartItem(productId, qty = 1) {
  const { data } = await api.post("/cart/items", { productId, qty });
  return data.data;
}

export async function updateCartItem(productId, qty) {
  const { data } = await api.patch(`/cart/items/${productId}`, { qty });
  return data.data;
}

export async function removeCartItem(productId) {
  const { data } = await api.delete(`/cart/items/${productId}`);
  return data.data;
}

export async function mergeCart(items) {
  const { data } = await api.post("/cart/merge", { items });
  return data.data;
}
