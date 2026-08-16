import { useQuery } from "@tanstack/react-query";
import { getPageBySlug, listPublishedPages } from "./pagesApi";

export function usePage(slug) {
  return useQuery({
    queryKey: ["pages", slug],
    queryFn: () => getPageBySlug(slug),
    retry: false, // a 404 (unpublished/missing page) is expected, not a transient failure
  });
}

export function usePublishedPages() {
  return useQuery({
    queryKey: ["pages", "published-list"],
    queryFn: listPublishedPages,
    staleTime: 10 * 60 * 1000, // guides change rarely; matches useBrands/useCategories
  });
}
