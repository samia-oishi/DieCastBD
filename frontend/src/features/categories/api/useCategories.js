import { useQuery } from "@tanstack/react-query";
import { bakedCategories } from "@/lib/bakedData";
import { listCategories } from "./categoryApi";

export function useCategories() {
  // See the note in useBrands — same build-time bake, same homepage-only scope.
  const baked = bakedCategories();

  return useQuery({
    queryKey: ["categories", "list"],
    queryFn: listCategories,
    staleTime: 10 * 60 * 1000,
    initialData: baked,
    initialDataUpdatedAt: baked ? 0 : undefined,
  });
}
