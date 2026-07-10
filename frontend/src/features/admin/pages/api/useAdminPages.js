import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminPages, getAdminPage, createPage, updatePage } from "./pagesAdminApi";

export function useAdminPages() {
  return useQuery({
    queryKey: ["admin", "pages", "list"],
    queryFn: listAdminPages,
  });
}

export function useAdminPage(id) {
  return useQuery({
    queryKey: ["admin", "pages", "detail", id],
    queryFn: () => getAdminPage(id),
    enabled: !!id,
  });
}

export function useCreatePageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pages"] }),
  });
}

export function useUpdatePageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updatePage(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pages"] }),
  });
}
