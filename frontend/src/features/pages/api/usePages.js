import { useQuery } from "@tanstack/react-query";
import { bakedPage, bakedPublishedPages } from "@/lib/bakedData";
import { getPageBySlug, listPublishedPages } from "./pagesApi";

export function usePage(slug) {
  // On a prerendered page the document is baked into the HTML, so the first
  // render always has content — even when the API is unreachable (the cause of
  // the Soft-404 incident, plan.md #92). initialDataUpdatedAt: 0 marks it
  // instantly stale, so TanStack refetches and swaps in the live document; a
  // FAILED refetch keeps this data, which is exactly the behaviour we want.
  const baked = bakedPage(slug);

  return useQuery({
    queryKey: ["pages", slug],
    queryFn: () => getPageBySlug(slug),
    retry: false, // a 404 (unpublished/missing page) is expected, not a transient failure
    initialData: baked,
    initialDataUpdatedAt: baked ? 0 : undefined,
  });
}

export function usePublishedPages() {
  const baked = bakedPublishedPages();

  return useQuery({
    queryKey: ["pages", "published-list"],
    queryFn: listPublishedPages,
    staleTime: 10 * 60 * 1000, // guides change rarely; matches useBrands/useCategories
    initialData: baked,
    initialDataUpdatedAt: baked ? 0 : undefined,
  });
}
