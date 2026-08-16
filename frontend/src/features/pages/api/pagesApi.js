import { api } from "@/lib/axios";

export async function getPageBySlug(slug) {
  const { data } = await api.get(`/pages/${slug}`);
  return data.data;
}

/** Published guides (policy pages excluded server-side) — feeds the
 * /collections hub's Guides section. */
export async function listPublishedPages() {
  const { data } = await api.get("/pages");
  return data.data;
}
