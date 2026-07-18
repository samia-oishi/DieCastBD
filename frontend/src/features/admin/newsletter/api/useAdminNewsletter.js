import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAdminSubscribers, deleteAdminSubscriber } from "./newsletterApi";

export function useAdminSubscribers(params) {
  return useQuery({
    queryKey: ["admin", "newsletter", "subscribers", params],
    queryFn: () => listAdminSubscribers(params),
    placeholderData: (previous) => previous,
  });
}

export function useDeleteSubscriberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminSubscriber,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "newsletter"] }),
  });
}
