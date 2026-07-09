import { useQuery } from "@tanstack/react-query";
import { getSettings } from "./settingsApi";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 10 * 60 * 1000,
  });
}
