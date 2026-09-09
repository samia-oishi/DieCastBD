import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminOrders, getAdminOrder, updateOrderStatus, deleteOrders, adjustOrderPayment, lookupCustomer, createAdminOrder, addOrderItems } from "./orderApi";

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

export function useAdjustPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => adjustOrderPayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      // The order total moved, so this day's revenue and profit did too.
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    },
  });
}

export function useAddOrderItemsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }) => addOrderItems(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      // Stock moved out of the pool, and the order total moved with it.
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    },
  });
}

/** Looks up a returning customer by phone. Only runs once the number is long
 * enough to be meaningful, so it doesn't fire on every keystroke. */
export function useCustomerLookup(phone) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return useQuery({
    queryKey: ["admin", "orders", "customer-lookup", digits],
    queryFn: () => lookupCustomer(digits),
    enabled: digits.length >= 11,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAdminOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminOrder,
    onSuccess: () => {
      // A new confirmed order commits stock and books revenue.
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}
