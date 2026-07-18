import { api } from "@/lib/axios";

export async function listAdminSubscribers(params) {
  const { data } = await api.get("/admin/newsletter/subscribers", { params });
  return data;
}

export async function deleteAdminSubscriber(id) {
  const { data } = await api.delete(`/admin/newsletter/subscribers/${id}`);
  return data;
}
