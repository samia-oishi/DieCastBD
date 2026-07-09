import { useQuery } from "@tanstack/react-query";
import { listBrands } from "./brandApi";

export function useBrands() {
  return useQuery({
    queryKey: ["brands", "list"],
    queryFn: listBrands,
    staleTime: 10 * 60 * 1000,
  });
}
