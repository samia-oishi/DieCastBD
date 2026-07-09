import { api } from "@/lib/axios";

export async function getSettings() {
  const { data } = await api.get("/settings");
  return data.data;
}
