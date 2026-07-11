import { api } from "@/lib/axios";

export async function listAdminInventory(params) {
  const { data } = await api.get("/admin/inventory", { params });
  return data;
}

export async function getProductInventoryLogs(productId) {
  const { data } = await api.get(`/admin/inventory/${productId}/logs`);
  return data.data;
}

export async function adjustStock(productId, payload) {
  const { data } = await api.post(`/admin/inventory/${productId}/adjust`, payload);
  return data.data;
}

export async function getProductRestockAlerts(productId) {
  const { data } = await api.get(`/admin/inventory/${productId}/restock-alerts`);
  return data.data;
}
