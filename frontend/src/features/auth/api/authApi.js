import { api } from "@/lib/axios";

export async function createSession(idToken) {
  const { data } = await api.post("/auth/session", { idToken });
  return data.data;
}

export async function refreshSession() {
  const { data } = await api.post("/auth/refresh");
  return data.data;
}

export async function logoutSession() {
  await api.post("/auth/logout");
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.data;
}
