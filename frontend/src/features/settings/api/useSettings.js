import { useQuery } from "@tanstack/react-query";
import { getSettings } from "./settingsApi";
import { readBakedSettings } from "./settingsBootstrap";

export function useSettings() {
  const baked = readBakedSettings();

  return useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 10 * 60 * 1000,
    // Build-time settings from the prerendered HTML (homepage only), so the
    // first render is already correct instead of guessing and then swapping.
    ...(baked
      ? {
          initialData: baked,
          // Deliberately marked as maximally stale: the payload is only as
          // fresh as the last deploy, so React renders it instantly and
          // TanStack refetches in the background straight away. Without this,
          // staleTime would suppress the refetch and a hero change wouldn't
          // show for 10 minutes.
          initialDataUpdatedAt: 0,
        }
      : {}),
  });
}
