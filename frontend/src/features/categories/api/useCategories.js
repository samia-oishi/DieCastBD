import { useQuery } from "@tanstack/react-query";
import { listCategories } from "./categoryApi";

export function useCategories() {
  return useQuery({
    queryKey: ["categories", "list"],
    queryFn: listCategories,
    staleTime: 10 * 60 * 1000,
  });
}
