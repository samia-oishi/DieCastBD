import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary, getAnalyticsDaily } from "./analyticsApi";

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
