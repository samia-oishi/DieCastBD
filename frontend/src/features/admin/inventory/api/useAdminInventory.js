import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminInventory, getProductInventoryLogs, adjustStock } from "./inventoryApi";

export function useAdminInventory(params) {
  return useQuery({
    queryKey: ["admin", "inventory", "list", params],
    queryFn: () => listAdminInventory(params),
    placeholderData: (previous) => previous,
  });
}

export function useProductInventoryLogs(productId) {
  return useQuery({
    queryKey: ["admin", "inventory", "logs", productId],
    queryFn: () => getProductInventoryLogs(productId),
    enabled: !!productId,
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }) => adjustStock(productId, payload),
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory", "logs", productId] });
    },
  });
}
