import { useBrands } from "@/features/admin/catalog/api/useBrands";
import { SimpleCatalogManager } from "@/features/admin/catalog/components/SimpleCatalogManager";

export function BrandsPage() {
  const brands = useBrands();
  return <SimpleCatalogManager title="Brands" resource={brands} imageField="logo" />;
}
