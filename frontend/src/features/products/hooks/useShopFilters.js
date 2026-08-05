import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";

const DEFAULT_SORT = "newest";

/** Drives all Shop page filter/sort/search state through the URL — shareable,
 * bookmarkable, back-button-safe, no separate component state to keep in sync.
 *
 * There is deliberately no `page`: the Shop page loads more as you scroll, so
 * page number is query state owned by useInfiniteQuery, not a URL concern.
 * Keeping it here would also poison the query key, since `filters` is spread
 * into it. */
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
    }),
    [searchParams]
  );

  /** Merges patch into the current filters. */
  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    next.delete("page"); // legacy param — the shop loads more on scroll now
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  // Strip a stale ?page=N arriving from an old bookmark or indexed link. SEO is
  // unaffected — /shop?page=N has always emitted a canonical pointing at /shop,
  // so nothing indexed is lost. replace: true matches every other write here
  // and avoids a back-button trap.
  useEffect(() => {
    if (!searchParams.has("page")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const activeFilterCount = ["brand", "category", "series", "minPrice", "maxPrice", "inStock", "featured", "newArrival"].filter(
    (key) => filters[key] !== undefined
  ).length;

  return { filters, updateFilters, clearFilters, activeFilterCount };
}
