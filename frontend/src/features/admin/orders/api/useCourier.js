import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCourierStatus, sendOrderToCourier, syncCourier, linkCourier, checkFraud } from "./courierApi";

export function useCourierStatus() {
  return useQuery({
    queryKey: ["admin", "courier", "status"],
    queryFn: getCourierStatus,
    staleTime: 10 * 60 * 1000, // credentials don't change during a session
  });
}

export function useSendToCourierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => sendOrderToCourier(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useSyncCourierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => syncCourier(ids),
    // Only refetch when something actually moved — the common case is that
    // every parcel is unchanged, and invalidating then would re-render the list
    // on every page open for nothing.
    onSuccess: (updated) => {
      if (updated?.length) queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

export function useFraudCheckMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }) => checkFraud(id, force),
    // The score is stored on the order, so both the detail page and the list
    // pick it up from the refetch rather than holding their own copy.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useLinkCourierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => linkCourier(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}
