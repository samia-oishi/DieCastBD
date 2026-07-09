import { useMutation } from "@tanstack/react-query";
import { submitContactMessage } from "./contactApi";

export function useSubmitContactMessageMutation() {
  return useMutation({ mutationFn: submitContactMessage });
}
