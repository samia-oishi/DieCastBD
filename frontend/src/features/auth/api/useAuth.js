import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import { authKeys } from "./authKeys";
import { fetchCurrentUser, createSession, logoutSession } from "./authApi";

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

// firebaseAuth.js is dynamic-imported inside each mutationFn below, not
// statically at the top of this file. useCurrentUser() (called unconditionally
// at app root by CartMergeOnLogin/ProtectedRoute/RequireRole) never calls
// Firebase itself — only fetchCurrentUser(), a plain cookie check — but a
// static top-level import here would still drag in the whole Firebase Auth
// SDK (firebaseAuth.js -> lib/firebase.js -> initializeApp()/getAuth(), a
// module-scope side effect that defeats tree-shaking) for every visitor on
// every page load. Deferring the import to first actual use (submitting
// login/register/forgot-password, or clicking sign out) keeps that ~117KB/
// 35KB-gzip chunk off the critical path for the guest majority who never
// touch auth in a given session.
export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, email, password }) => {
      const { registerWithEmail } = await import("./firebaseAuth");
      const firebaseUser = await registerWithEmail({ name, email, password });
      return establishSession(firebaseUser, queryClient);
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { loginWithEmail } = await import("./firebaseAuth");
      const firebaseUser = await loginWithEmail({ email, password });
      return establishSession(firebaseUser, queryClient);
    },
  });
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { loginWithGoogle } = await import("./firebaseAuth");
      const firebaseUser = await loginWithGoogle();
      return establishSession(firebaseUser, queryClient);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (email) => {
      const { requestPasswordReset } = await import("./firebaseAuth");
      return requestPasswordReset(email);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { signOutFirebase } = await import("./firebaseAuth");
      await Promise.allSettled([signOutFirebase(), logoutSession()]);
    },
    onSuccess: () => {
      useAuthStore.getState().clearSession();
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
}
