import { useQuery } from "@tanstack/react-query";
import { getPageBySlug } from "./pagesApi";

export function usePage(slug) {
  return useQuery({
    queryKey: ["pages", slug],
    queryFn: () => getPageBySlug(slug),
    retry: false, // a 404 (unpublished/missing page) is expected, not a transient failure
  });
}
