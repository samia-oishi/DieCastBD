import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import { authKeys } from "./authKeys";
import { fetchCurrentUser, createSession, logoutSession } from "./authApi";
import { hasSessionHint, setSessionHint, clearSessionHint } from "./sessionHint";

async function establishSession(firebaseUser, queryClient) {
  const idToken = await firebaseUser.getIdToken();
  const user = await createSession(idToken);
  setSessionHint();
  queryClient.setQueryData(authKeys.me, user);
  useAuthStore.getState().setSession(user);
  return user;
}

export function useCurrentUser() {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Skip the round trip entirely when this browser has never signed in — see
  // sessionHint.js. Guests and crawlers are the overwhelming majority of page
  // loads, and for them this request can only ever answer 401.
  const enabled = hasSessionHint();

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      clearSession();
      return;
    }
    if (query.isSuccess) setSession(query.data);
    // A 401 means the cookie is gone or expired: drop the marker so the next
    // page load doesn't ask again.
    if (query.isError) {
      clearSession();
      clearSessionHint();
    }
  }, [enabled, query.isSuccess, query.isError, query.data, setSession, clearSession]);

  // A DISABLED query reports isLoading=false AND isError=false, which reads as
  // "still deciding" to the route guards — ProtectedRoute would have rendered
  // its <Outlet/> and let a guest straight into /account. Report the truth
  // instead: we know for certain there is no session, so guards redirect to
  // login exactly as they do for a real 401.
  if (!enabled) {
    return { ...query, data: undefined, isPending: false, isLoading: false, isSuccess: false, isError: true };
  }

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
      // Drop the marker too, or every page load after signing out would go back
      // to asking the server a question it already knows the answer to.
      clearSessionHint();
      useAuthStore.getState().clearSession();
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
}
