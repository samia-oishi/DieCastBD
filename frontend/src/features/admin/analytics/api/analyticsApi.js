import { api } from "@/lib/axios";

export async function getAnalyticsSummary() {
  const { data } = await api.get("/admin/analytics/summary");
  return data.data;
}

export async function getAnalyticsDaily(days = 30) {
  const { data } = await api.get("/admin/analytics/daily", { params: { days } });
  return data.data;
}

export async function getAnalyticsDailyRange(startDate, endDate) {
  const { data } = await api.get("/admin/analytics/daily", { params: { startDate, endDate } });
  return data.data;
}
