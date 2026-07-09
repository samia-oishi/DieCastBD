import { api } from "@/lib/axios";

export async function subscribeToNewsletter(email) {
  await api.post("/newsletter/subscribe", { email });
}
