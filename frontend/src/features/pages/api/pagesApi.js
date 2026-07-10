import { api } from "@/lib/axios";

export async function getPageBySlug(slug) {
  const { data } = await api.get(`/pages/${slug}`);
  return data.data;
}
