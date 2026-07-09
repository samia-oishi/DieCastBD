import { useCatalogResource } from "./useCatalogResource";
import {
  listAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "./categoryApi";

export function useCategories() {
  return useCatalogResource("categories", {
    list: listAdminCategories,
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
    uploadImage: uploadCategoryImage,
  });
}
