import { useCategories } from "@/features/admin/catalog/api/useCategories";
import { SimpleCatalogManager } from "@/features/admin/catalog/components/SimpleCatalogManager";

export function CategoriesPage() {
  const categories = useCategories();
  return <SimpleCatalogManager title="Categories" resource={categories} imageField="image" />;
}
