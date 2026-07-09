import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminOrders, getAdminOrder, updateOrderStatus } from "./orderApi";

export function useAdminOrders(params) {
  return useQuery({
    queryKey: ["admin", "orders", "list", params],
    queryFn: () => listAdminOrders(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminOrder(id) {
  return useQuery({
    queryKey: ["admin", "orders", "detail", id],
    queryFn: () => getAdminOrder(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateOrderStatus(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}
