import { api } from "@/lib/axios";

export async function validateCoupon(code, subtotal) {
  const { data } = await api.post("/coupons/validate", { code, subtotal });
  return data.data;
}
