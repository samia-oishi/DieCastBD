import { api } from "@/lib/axios";

export async function listAdminOrders(params) {
  const { data } = await api.get("/admin/orders", { params });
  return data;
}

export async function getAdminOrder(id) {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data;
}

export async function updateOrderStatus(id, payload) {
  const { data } = await api.patch(`/admin/orders/${id}/status`, payload);
  return data.data;
}
