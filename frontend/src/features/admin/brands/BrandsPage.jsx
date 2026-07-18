import { SimpleCatalogManager } from "@/features/admin/catalog/components/SimpleCatalogManager";
import { useBrands } from "@/features/admin/catalog/api/useBrands";

export function BrandsPage() {
  return (
    <SimpleCatalogManager
      title="Brands"
      singular="Brand"
      resource={useBrands()}
      imageField="logo"
      productFilterKey="brand"
    />
  );
}
