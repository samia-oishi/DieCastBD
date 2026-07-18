import { api } from "@/lib/axios";

export async function listAdminPages() {
  const { data } = await api.get("/admin/pages");
  return data.data;
}

export async function getAdminPage(id) {
  const { data } = await api.get(`/admin/pages/${id}`);
  return data.data;
}

export async function createPage(payload) {
  const { data } = await api.post("/admin/pages", payload);
  return data.data;
}

export async function updatePage(id, payload) {
  const { data } = await api.patch(`/admin/pages/${id}`, payload);
  return data.data;
}

export async function deletePage(id) {
  const { data } = await api.delete(`/admin/pages/${id}`);
  return data;
}
