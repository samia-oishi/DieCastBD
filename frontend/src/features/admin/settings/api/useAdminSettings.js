import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSettings, uploadSettingsImage } from "./settingsApi";

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useUploadSettingsImageMutation() {
  return useMutation({ mutationFn: uploadSettingsImage });
}
