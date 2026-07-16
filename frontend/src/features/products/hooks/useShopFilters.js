import { useMemo } from "react";
import { useSearchParams } from "react-router";

const DEFAULT_SORT = "newest";

/** Drives all Shop page filter/sort/search/pagination state through the URL —
 * shareable, bookmarkable, back-button-safe, no separate component state to
 * keep in sync. */
export function useShopFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      brand: searchParams.get("brand") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      series: searchParams.get("series") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      inStock: searchParams.get("inStock") === "true" ? true : undefined,
      featured: searchParams.get("featured") === "true" ? true : undefined,
      newArrival: searchParams.get("newArrival") === "true" ? true : undefined,
      sort: searchParams.get("sort") ?? DEFAULT_SORT,
      q: searchParams.get("q") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
    }),
    [searchParams]
  );

  /** Merges patch into the current filters; any filter change resets page to 1. */
  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const setPage = (page) => {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  const activeFilterCount = ["brand", "category", "series", "minPrice", "maxPrice", "inStock", "featured", "newArrival"].filter(
    (key) => filters[key] !== undefined
  ).length;

  return { filters, updateFilters, setPage, clearFilters, activeFilterCount };
}
