import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminSettings, updateSettings, uploadSettingsImage } from "./settingsApi";

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

export function useUploadSettingsImageMutation() {
  return useMutation({ mutationFn: uploadSettingsImage });
}

export function useAdminSettingsQuery() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminSettings,
  });
}
