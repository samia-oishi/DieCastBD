import { api } from "@/lib/axios";

export async function submitContactMessage(payload) {
  const { data } = await api.post("/contact", payload);
  return data;
}
