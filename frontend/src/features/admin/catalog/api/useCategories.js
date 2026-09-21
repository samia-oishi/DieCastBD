import { useCatalogResource } from "./useCatalogResource";
import {
  listAdminCategories,
  reorderCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "./categoryApi";

export function useCategories() {
  return useCatalogResource("categories", {
    list: listAdminCategories,
    reorder: reorderCategories,
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
    uploadImage: uploadCategoryImage,
  });
}
