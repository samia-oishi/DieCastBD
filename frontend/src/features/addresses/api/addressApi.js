import { api } from "@/lib/axios";

export async function listAddresses() {
  const { data } = await api.get("/addresses");
  return data.data;
}

export async function createAddress(payload) {
  const { data } = await api.post("/addresses", payload);
  return data.data;
}

export async function updateAddress(id, payload) {
  const { data } = await api.patch(`/addresses/${id}`, payload);
  return data.data;
}

export async function deleteAddress(id) {
  await api.delete(`/addresses/${id}`);
}
