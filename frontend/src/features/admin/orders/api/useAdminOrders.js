import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminOrders, getAdminOrder, updateOrderStatus, deleteOrders } from "./orderApi";

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

export function useDeleteOrdersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => deleteOrders(ids),
    onSuccess: () => {
      // Deleting returns stock, so the inventory/product views are stale too.
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}
