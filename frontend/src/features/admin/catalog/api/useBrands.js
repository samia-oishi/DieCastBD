import { useCatalogResource } from "./useCatalogResource";
import {
  listAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandLogo,
} from "./brandApi";

export function useBrands() {
  return useCatalogResource("brands", {
    list: listAdminBrands,
    create: createBrand,
    update: updateBrand,
    delete: deleteBrand,
    uploadImage: uploadBrandLogo,
  });
}
