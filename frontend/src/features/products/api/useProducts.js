import { useQuery } from "@tanstack/react-query";
import { productKeys } from "./productKeys";
import { listProducts, getProductBySlug, getRelatedProducts } from "./productApi";

export function useProducts(params) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
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
