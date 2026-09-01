import { api } from "@/lib/axios";

/** Whether Steadfast credentials are configured, plus the account balance —
 * used to hide the courier controls entirely rather than show buttons that can
 * only fail. */
export async function getCourierStatus() {
  const { data } = await api.get("/admin/courier/status");
  return data.data;
}

/** Creates a REAL Steadfast consignment for this order. Not idempotent on their
 * side, so the backend refuses a second send with a 409. */
export async function sendOrderToCourier(id) {
  const { data } = await api.post(`/admin/courier/orders/${id}`);
  return data.data;
}

/** Refreshes delivery status for the given orders. The backend skips finished
 * parcels and anything checked in the last five minutes, so calling this on
 * every list open is cheap. */
export async function syncCourier(ids) {
  const { data } = await api.post("/admin/courier/sync", { ids });
  return data.data;
}
