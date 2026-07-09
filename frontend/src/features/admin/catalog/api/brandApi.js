import { api } from "@/lib/axios";

export async function listAdminBrands() {
  const { data } = await api.get("/admin/brands");
  return data.data;
}

export async function createBrand(payload) {
  const { data } = await api.post("/admin/brands", payload);
  return data.data;
}

export async function updateBrand(id, payload) {
  const { data } = await api.patch(`/admin/brands/${id}`, payload);
  return data.data;
}

export async function deleteBrand(id) {
  await api.delete(`/admin/brands/${id}`);
}

export async function uploadBrandLogo(id, file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post(`/admin/brands/${id}/logo`, formData);
  return data.data;
}
