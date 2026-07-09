import { useMutation } from "@tanstack/react-query";
import { subscribeToNewsletter } from "./newsletterApi";

export function useSubscribeMutation() {
  return useMutation({ mutationFn: subscribeToNewsletter });
}
