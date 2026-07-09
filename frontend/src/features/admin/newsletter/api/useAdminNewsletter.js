import { useQuery } from "@tanstack/react-query";
import { listAdminSubscribers } from "./newsletterApi";

export function useAdminSubscribers(params) {
  return useQuery({
    queryKey: ["admin", "newsletter", "subscribers", params],
    queryFn: () => listAdminSubscribers(params),
    placeholderData: (previous) => previous,
  });
}
