import { SimpleCatalogManager } from "@/features/admin/catalog/components/SimpleCatalogManager";
import { useCategories } from "@/features/admin/catalog/api/useCategories";

export function CategoriesPage() {
  return (
    <SimpleCatalogManager
      title="Categories"
      singular="Category"
      resource={useCategories()}
      imageField="image"
      productFilterKey="category"
    />
  );
}
