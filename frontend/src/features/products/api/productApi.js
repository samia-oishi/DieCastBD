import { api } from "@/lib/axios";

export async function listProducts(params) {
  const { data } = await api.get("/products", { params });
  return data;
}

export async function getProductBySlug(slug) {
  const { data } = await api.get(`/products/${slug}`);
  return data.data;
}

export async function getRelatedProducts(slug) {
  const { data } = await api.get(`/products/${slug}/related`);
  return data.data;
}
