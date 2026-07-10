import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary, getAnalyticsDaily, getAnalyticsDailyRange } from "./analyticsApi";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["admin", "analytics", "summary"],
    queryFn: getAnalyticsSummary,
  });
}

export function useAnalyticsDaily(days = 30) {
  return useQuery({
    queryKey: ["admin", "analytics", "daily", days],
    queryFn: () => getAnalyticsDaily(days),
  });
}

// Powers the Dashboard's custom-range filter — only enabled once both dates
// are picked, so it never fires a request with a half-filled range.
export function useAnalyticsDailyRange(startDate, endDate) {
  return useQuery({
    queryKey: ["admin", "analytics", "daily", "range", startDate, endDate],
    queryFn: () => getAnalyticsDailyRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
