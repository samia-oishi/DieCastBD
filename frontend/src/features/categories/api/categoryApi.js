import { api } from "@/lib/axios";

export async function listCategories() {
  const { data } = await api.get("/categories");
  return data.data;
}
