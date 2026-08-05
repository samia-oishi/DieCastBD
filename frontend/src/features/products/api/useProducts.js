import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { productKeys } from "./productKeys";
import { listProducts, getProductBySlug, getRelatedProducts, getFilterOptions } from "./productApi";

export function useProducts(params) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    placeholderData: (previous) => previous, // keeps the grid from flashing empty between pages/filters
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
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 2,
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
