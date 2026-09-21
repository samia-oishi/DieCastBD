import { useCatalogResource } from "./useCatalogResource";
import {
  listAdminBrands,
  reorderBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandLogo,
} from "./brandApi";

export function useBrands() {
  return useCatalogResource("brands", {
    list: listAdminBrands,
    reorder: reorderBrands,
    create: createBrand,
    update: updateBrand,
    delete: deleteBrand,
    uploadImage: uploadBrandLogo,
  });
}
