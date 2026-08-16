import { useQuery } from "@tanstack/react-query";
import { bakedBrands } from "@/lib/bakedData";
import { listBrands } from "./brandApi";

export function useBrands() {
  // Baked into the homepage HTML at build time so the Shop-by-shelf tiles paint
  // with the rest of the page; undefined everywhere else. See lib/bakedData.js.
  const baked = bakedBrands();

  return useQuery({
    queryKey: ["brands", "list"],
    queryFn: listBrands,
    staleTime: 10 * 60 * 1000,
    initialData: baked,
    initialDataUpdatedAt: baked ? 0 : undefined,
  });
}
