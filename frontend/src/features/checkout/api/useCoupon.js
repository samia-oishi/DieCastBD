import { useMutation } from "@tanstack/react-query";
import { validateCoupon } from "./couponApi";

export function useValidateCouponMutation() {
  return useMutation({
    mutationFn: ({ code, subtotal }) => validateCoupon(code, subtotal),
  });
}
