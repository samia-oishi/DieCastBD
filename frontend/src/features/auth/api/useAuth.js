import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import { authKeys } from "./authKeys";
import { fetchCurrentUser, createSession, logoutSession } from "./authApi";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  requestPasswordReset,
  signOutFirebase,
} from "./firebaseAuth";

async function establishSession(firebaseUser, queryClient) {
  const idToken = await firebaseUser.getIdToken();
  const user = await createSession(idToken);
  queryClient.setQueryData(authKeys.me, user);
  useAuthStore.getState().setSession(user);
  return user;
}

export function useCurrentUser() {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isSuccess) setSession(query.data);
    if (query.isError) clearSession();
  }, [query.isSuccess, query.isError, query.data, setSession, clearSession]);

  return query;
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, email, password }) => {
      const firebaseUser = await registerWithEmail({ name, email, password });
      return establishSession(firebaseUser, queryClient);
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const firebaseUser = await loginWithEmail({ email, password });
      return establishSession(firebaseUser, queryClient);
    },
  });
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const firebaseUser = await loginWithGoogle();
      return establishSession(firebaseUser, queryClient);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email) => requestPasswordReset(email),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await Promise.allSettled([signOutFirebase(), logoutSession()]);
    },
    onSuccess: () => {
      useAuthStore.getState().clearSession();
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
}
