import { api } from "@/lib/axios";

export async function createOrder(payload) {
  const { data } = await api.post("/orders", payload);
  return data.data;
}

export async function listMyOrders() {
  const { data } = await api.get("/orders");
  return data.data;
}

export async function getOrderByNumber(orderNumber) {
  const { data } = await api.get(`/orders/${orderNumber}`);
  return data.data;
}
