import { api } from "@/lib/axios";

export async function listAdminProducts(params) {
  const { data } = await api.get("/admin/products", { params });
  return data;
}

export async function getAdminProduct(id) {
  const { data } = await api.get(`/admin/products/${id}`);
  return data.data;
}

export async function createProduct(payload) {
  const { data } = await api.post("/admin/products", payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/admin/products/${id}`, payload);
  return data.data;
}

export async function deleteProduct(id) {
  await api.delete(`/admin/products/${id}`);
}

export async function bulkUpdateProductStatus(ids, status) {
  const { data } = await api.patch("/admin/products/bulk-status", { ids, status });
  return data;
}

export async function bulkDeleteProducts(ids) {
  const { data } = await api.delete("/admin/products", { data: { ids } });
  return data;
}

export async function uploadProductThumbnail(id, file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post(`/admin/products/${id}/thumbnail`, formData);
  return data.data;
}

export async function addProductGalleryImages(id, files) {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);
  const { data } = await api.post(`/admin/products/${id}/gallery`, formData);
  return data.data;
}

export async function deleteProductGalleryImage(id, index) {
  const { data } = await api.delete(`/admin/products/${id}/gallery/${index}`);
  return data.data;
}
