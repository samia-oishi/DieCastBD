import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProductKeys } from "./productKeys";
import {
  listAdminProducts,
  getAdminProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProductStatus,
  bulkDeleteProducts,
  uploadProductThumbnail,
  addProductGalleryImages,
  deleteProductGalleryImage,
} from "./productApi";

export function useAdminProducts(params) {
  return useQuery({
    queryKey: adminProductKeys.list(params),
    queryFn: () => listAdminProducts(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminProduct(id) {
  return useQuery({
    queryKey: adminProductKeys.detail(id),
    queryFn: () => getAdminProduct(id),
    enabled: !!id,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
}

export function useCreateProductMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: createProduct, onSuccess: invalidate });
}

export function useUpdateProductMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteProductMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: deleteProduct, onSuccess: invalidate });
}

export function useBulkProductStatusMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ ids, status }) => bulkUpdateProductStatus(ids, status),
    onSuccess: invalidate,
  });
}

export function useBulkDeleteProductsMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: (ids) => bulkDeleteProducts(ids), onSuccess: invalidate });
}

export function useUploadThumbnailMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, file }) => uploadProductThumbnail(id, file),
    onSuccess: invalidate,
  });
}

export function useAddGalleryImagesMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, files }) => addProductGalleryImages(id, files),
    onSuccess: invalidate,
  });
}

export function useDeleteGalleryImageMutation() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, index }) => deleteProductGalleryImage(id, index),
    onSuccess: invalidate,
  });
}
