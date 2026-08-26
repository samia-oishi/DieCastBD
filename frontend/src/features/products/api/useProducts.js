import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { paramsKey } from "@/lib/paramsKey";
import { bakedProduct, bakedProductList } from "@/lib/bakedData";
import { productKeys } from "./productKeys";
import { listProducts, getProductBySlug, getRelatedProducts, getFilterOptions } from "./productApi";

export function useProducts(params) {
  // On the prerendered homepage, this query's response is already in the HTML,
  // so the cards render with the shell instead of after a round trip. Any query
  // that wasn't baked (every other page) gets undefined and behaves as before.
  const baked = bakedProductList(paramsKey(params));

  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    placeholderData: (previous) => previous, // keeps the grid from flashing empty between pages/filters
    initialData: baked,
    // Build-time data, so treat it as instantly stale: TanStack refetches on
    // mount and swaps in live stock/prices, while the baked copy is what paints
    // first. Without this the page could sit on deploy-time data.
    initialDataUpdatedAt: baked ? 0 : undefined,
  });
}

/** Paged product list for the Shop page's infinite scroll.
 *
 * `params` must NOT carry a `page` — page enters only through `pageParam`.
 * Putting it in params would mint a fresh cache entry per page and the
 * accumulated list would be thrown away on every fetch.
 */
export function useInfiniteProducts(params) {
  return useInfiniteQuery({
    queryKey: productKeys.infinite(params),
    queryFn: ({ pageParam }) => listProducts({ ...params, page: pageParam }),
    initialPageParam: 1,
    // Reads lastPageParam (which TanStack owns) rather than lastPage.meta.page,
    // so it can't drift if the response shape ever changes. An empty result
    // gives totalPages 0, so 1 < 0 is false and hasNextPage is correctly false.
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPageParam < (lastPage?.meta?.totalPages ?? 0) ? lastPageParam + 1 : undefined,
    placeholderData: (previous) => previous, // no empty flash between filter changes
  });
}

/** A 404 here is a real answer — the product was archived, deleted, or the slug
 * was renamed — so don't retry it. Retrying spent ~7s (3 attempts with backoff)
 * parked on the loading spinner before the 404 page could render, which is long
 * enough that a crawler may give up before ever seeing its `noindex`, leaving a
 * dead product URL indexed. Other failures ARE transient and still retry, so a
 * blip never turns a live product into a "page not found". Mirrors usePage. */
export function useProduct(slug) {
  // Prerendered product pages bake the full document into the HTML, so the
  // detail page renders even when the API is unreachable — the failure mode
  // that had Google classifying rendered pages as Soft 404 (plan.md #92).
  const baked = bakedProduct(slug);

  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 2,
    initialData: baked,
    initialDataUpdatedAt: baked ? 0 : undefined,
  });
}

export function useRelatedProducts(slug) {
  return useQuery({
    queryKey: productKeys.related(slug),
    queryFn: () => getRelatedProducts(slug),
    enabled: !!slug,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ["products", "filter-options"],
    queryFn: getFilterOptions,
    staleTime: 10 * 60 * 1000,
  });
}
