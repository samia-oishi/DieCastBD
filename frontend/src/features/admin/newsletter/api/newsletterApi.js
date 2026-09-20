import { api } from "@/lib/axios";

export async function listAdminSubscribers(params) {
  const { data } = await api.get("/admin/newsletter/subscribers", { params });
  return data;
}

export async function deleteAdminSubscriber(id) {
  const { data } = await api.delete(`/admin/newsletter/subscribers/${id}`);
  return data;
}

/** The wider audience: newsletter signups plus account holders, guest
 * checkouts and restock waiters, deduplicated, each tagged with its sources.
 * `meta.counts` carries the per-source totals for the filter chips. */
export async function listAdminAudience(params) {
  const { data } = await api.get("/admin/newsletter/audience", { params });
  return data;
}
