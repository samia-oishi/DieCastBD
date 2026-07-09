import { api } from "@/lib/axios";

export async function listAdminUsers(params) {
  const { data } = await api.get("/admin/users", { params });
  return data;
}

export async function getAdminUser(id) {
  const { data } = await api.get(`/admin/users/${id}`);
  return data.data;
}

export async function updateAdminUser(id, payload) {
  const { data } = await api.patch(`/admin/users/${id}`, payload);
  return data.data;
}

export async function changeUserRole(id, role) {
  const { data } = await api.patch(`/admin/users/${id}/role`, { role });
  return data.data;
}
