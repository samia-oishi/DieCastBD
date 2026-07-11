import { useSyncExternalStore } from "react";

/** SSR-safe media-query hook. Used to switch a single component between a
 * desktop dialog and a mobile bottom sheet (RestockAlertDialog) without
 * duplicating its inner content. */
export function useMediaQuery(query) {
  function subscribe(callback) {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }
  function getSnapshot() {
    return window.matchMedia(query).matches;
  }
  function getServerSnapshot() {
    return false;
  }
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
