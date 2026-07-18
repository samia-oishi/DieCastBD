import { api } from "@/lib/axios";

/** Admin's own read of the settings document — hits the uncached admin route,
 * so the form never re-baselines from a stale HTTP-cached copy after a save. */
export async function getAdminSettings() {
  const { data } = await api.get("/admin/settings");
  return data.data;
}

export async function updateSettings(payload) {
  const { data } = await api.patch("/admin/settings", payload);
  return data.data;
}

export async function uploadSettingsImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/admin/settings/upload-image", formData);
  return data.data;
}
