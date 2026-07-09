import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, listMyOrders, getOrderByNumber } from "./orderApi";
import { cartKey } from "@/features/cart/api/useCart";

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey }),
  });
}

export function useMyOrders() {
  return useQuery({ queryKey: ["orders", "mine"], queryFn: listMyOrders });
}

export function useOrder(orderNumber) {
  return useQuery({
    queryKey: ["orders", "detail", orderNumber],
    queryFn: () => getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });
}
