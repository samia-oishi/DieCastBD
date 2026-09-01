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

/** Permanent bulk delete. The backend releases/restores each order's stock in the
 * same transaction and returns { deletedCount, unitsReturnedToStock }. */
export async function deleteOrders(ids) {
  const { data } = await api.delete("/admin/orders", { data: { ids } });
  return data;
}

/** Records money received outside checkout, or a discount agreed in
 * conversation. The backend keeps amountPaid + amountDue === total. */
export async function adjustOrderPayment(id, payload) {
  const { data } = await api.patch(`/admin/orders/${id}/payment`, payload);
  return data;
}

/** Finds a past customer by phone so the admin create-order form can reuse the
 * address that was actually delivered to. Admin-only — never exposed to the
 * storefront, where it would be an address-harvesting endpoint. */
export async function lookupCustomer(phone) {
  const { data } = await api.get("/admin/orders/customer-lookup", { params: { phone } });
  return data.data;
}

/** Creates an order taken by Facebook, Messenger or phone. */
export async function createAdminOrder(payload) {
  const { data } = await api.post("/admin/orders", payload);
  return data;
}
