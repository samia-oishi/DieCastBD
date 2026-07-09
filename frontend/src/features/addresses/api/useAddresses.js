import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAddresses, createAddress, updateAddress, deleteAddress } from "./addressApi";

const addressKey = ["addresses"];

export function useAddresses() {
  return useQuery({ queryKey: addressKey, queryFn: listAddresses });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKey }),
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateAddress(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKey }),
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKey }),
  });
}
