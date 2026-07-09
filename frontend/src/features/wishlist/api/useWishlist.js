import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/api/useAuth";
import { listWishlist, addToWishlist, removeFromWishlist } from "./wishlistApi";

const wishlistKey = ["wishlist"];

/** Source of truth for both the Wishlist page and every heart-button's checked state —
 * one query, no N+1 per-card requests. Disabled entirely for guests (no pointless 401s). */
export function useWishlist() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: wishlistKey,
    queryFn: listWishlist,
    enabled: !!user,
  });
}

export function useIsWishlisted(productId) {
  const { data: wishlist } = useWishlist();
  return useMemo(() => !!wishlist?.some((p) => p._id === productId), [wishlist, productId]);
}

export function useToggleWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, isWishlisted }) =>
      isWishlisted ? removeFromWishlist(productId) : addToWishlist(productId),
    onMutate: async ({ product, isWishlisted }) => {
      await queryClient.cancelQueries({ queryKey: wishlistKey });
      const previous = queryClient.getQueryData(wishlistKey);

      queryClient.setQueryData(wishlistKey, (current = []) =>
        isWishlisted ? current.filter((p) => p._id !== product._id) : [product, ...current]
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) queryClient.setQueryData(wishlistKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: wishlistKey }),
  });
}
