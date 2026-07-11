import { useEffect } from "react";
import { useLocation } from "react-router";

/** Resets scroll to the top on every route change. Keyed on `pathname` only, so
 * search-param updates (Shop filters/search, pagination) don't yank the page to
 * the top — only real page navigations do. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
