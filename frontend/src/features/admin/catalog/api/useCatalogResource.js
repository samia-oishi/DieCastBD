import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Brands and Categories share identical CRUD + image-upload shape — one hook covers both. */
export function useCatalogResource(resourceName, resourceApi) {
  const queryKey = ["admin", resourceName];
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const list = useQuery({ queryKey, queryFn: resourceApi.list });
  const create = useMutation({ mutationFn: resourceApi.create, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, payload }) => resourceApi.update(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: resourceApi.delete, onSuccess: invalidate });
  const uploadImage = useMutation({
    mutationFn: ({ id, file }) => resourceApi.uploadImage(id, file),
    onSuccess: invalidate,
  });

  return { list, create, update, remove, uploadImage };
}
