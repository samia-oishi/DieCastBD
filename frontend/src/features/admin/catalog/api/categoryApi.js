import { api } from "@/lib/axios";

export async function listAdminCategories() {
  const { data } = await api.get("/admin/categories");
  return data.data;
}

export async function createCategory(payload) {
  const { data } = await api.post("/admin/categories", payload);
  return data.data;
}

export async function updateCategory(id, payload) {
  const { data } = await api.patch(`/admin/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id) {
  await api.delete(`/admin/categories/${id}`);
}

export async function uploadCategoryImage(id, file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post(`/admin/categories/${id}/image`, formData);
  return data.data;
}
