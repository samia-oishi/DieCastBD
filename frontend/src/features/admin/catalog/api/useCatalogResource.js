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

  /** Save a whole new display order (an array of ids, position = sortOrder).
   *
   * Optimistic on purpose: dragging a row is a direct-manipulation gesture, and
   * a row that springs back to its old slot for the length of a round trip
   * reads as "the drag failed". The cache is rewritten first, the previous list
   * kept, and put back verbatim if the request errors — so the list never shows
   * an order the server didn't accept. */
  const reorder = useMutation({
    mutationFn: resourceApi.reorder,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) {
        const byId = new Map(previous.map((item) => [item._id, item]));
        queryClient.setQueryData(
          queryKey,
          ids.map((id) => byId.get(id)).filter(Boolean)
        );
      }
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: invalidate,
  });
  const uploadImage = useMutation({
    mutationFn: ({ id, file }) => resourceApi.uploadImage(id, file),
    onSuccess: invalidate,
  });

  return { list, create, update, remove, uploadImage, reorder };
}
