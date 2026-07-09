import { api } from "@/lib/axios";

export async function updateProfile(updates) {
  const { data } = await api.patch("/users/me", updates);
  return data.data;
}

export async function deactivateAccount() {
  await api.delete("/users/me");
}
