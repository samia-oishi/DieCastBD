import { api } from "@/lib/axios";

export async function listAdminCoupons(params) {
  const { data } = await api.get("/admin/coupons", { params });
  return data;
}

export async function createCoupon(payload) {
  const { data } = await api.post("/admin/coupons", payload);
  return data.data;
}

export async function updateCoupon(id, payload) {
  const { data } = await api.patch(`/admin/coupons/${id}`, payload);
  return data.data;
}

export async function deleteCoupon(id) {
  const { data } = await api.delete(`/admin/coupons/${id}`);
  return data;
}
