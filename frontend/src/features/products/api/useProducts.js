import { useMutation, useQuery } from "@tanstack/react-query";
import { productKeys } from "./productKeys";
import { listProducts, getProductBySlug, getRelatedProducts, getFilterOptions, createRestockAlert } from "./productApi";

export function useProducts(params) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    placeholderData: (previous) => previous, // keeps the grid from flashing empty between pages/filters
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
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

export function useRestockAlertMutation() {
  return useMutation({
    mutationFn: ({ productId, contact }) => createRestockAlert(productId, contact),
  });
}
