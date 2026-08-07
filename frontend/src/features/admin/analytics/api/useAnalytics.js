import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary, getAnalyticsDaily, getAnalyticsDailyRange } from "./analyticsApi";

export function useAnalyticsSummary(range = "today") {
  return useQuery({
    queryKey: ["admin", "analytics", "summary", range],
    // Keeps the previous range's numbers on screen while the next one loads,
    // so switching a chip doesn't blank the whole KPI row.
    placeholderData: (prev) => prev,
    queryFn: () => getAnalyticsSummary(range),
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
