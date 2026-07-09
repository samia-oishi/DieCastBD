import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminUsers, getAdminUser, updateAdminUser, changeUserRole } from "./customerApi";

export function useAdminUsers(params) {
  return useQuery({
    queryKey: ["admin", "users", "list", params],
    queryFn: () => listAdminUsers(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminUser(id) {
  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => getAdminUser(id),
    enabled: !!id,
  });
}

export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateAdminUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useChangeUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => changeUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
