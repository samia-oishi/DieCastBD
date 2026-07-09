import { api } from "@/lib/axios";

export async function listBrands() {
  const { data } = await api.get("/brands");
  return data.data;
}
