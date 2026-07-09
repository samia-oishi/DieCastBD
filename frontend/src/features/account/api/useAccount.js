import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import { authKeys } from "@/features/auth/api/authKeys";
import { signOutFirebase } from "@/features/auth/api/firebaseAuth";
import { updateProfile, deactivateAccount } from "./accountApi";

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
      useAuthStore.getState().setSession(user);
    },
  });
}

export function useDeactivateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await deactivateAccount();
      await signOutFirebase();
    },
    onSuccess: () => {
      useAuthStore.getState().clearSession();
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
}
