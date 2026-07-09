import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from "./couponApi";

export function useAdminCoupons(params) {
  return useQuery({
    queryKey: ["admin", "coupons", "list", params],
    queryFn: () => listAdminCoupons(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useUpdateCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateCoupon(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useDeleteCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}
