import { api } from "@/lib/axios";

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
