import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useCartStore } from "@/stores/cartStore";
import { getCart, addCartItem, updateCartItem, removeCartItem } from "./cartApi";

export const cartKey = ["cart"];

/** One interface regardless of auth state — guest cart (Zustand/localStorage)
 * for logged-out visitors, server cart (this API) once logged in. Components
 * never branch on auth state themselves. All hooks below are called
 * unconditionally (Rules of Hooks) — only the returned data/actions differ. */
export function useCart() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const guestItems = useCartStore((s) => s.items);
  const guestAddItem = useCartStore((s) => s.addItem);
  const guestUpdateQty = useCartStore((s) => s.updateQty);
  const guestRemoveItem = useCartStore((s) => s.removeItem);

  const cartQuery = useQuery({ queryKey: cartKey, queryFn: getCart, enabled: !!user });

  const addMutation = useMutation({
    mutationFn: ({ productId, qty }) => addCartItem(productId, qty),
    onSuccess: (data) => queryClient.setQueryData(cartKey, data),
  });
  const updateMutation = useMutation({
    mutationFn: ({ productId, qty }) => updateCartItem(productId, qty),
    onSuccess: (data) => queryClient.setQueryData(cartKey, data),
  });
  const removeMutation = useMutation({
    mutationFn: (productId) => removeCartItem(productId),
    onSuccess: (data) => queryClient.setQueryData(cartKey, data),
  });

  if (user) {
    return {
      items: cartQuery.data?.items ?? [],
      subtotal: cartQuery.data?.subtotal ?? 0,
      itemCount: cartQuery.data?.itemCount ?? 0,
      isLoading: cartQuery.isLoading,
      addItem: (product, qty = 1) => addMutation.mutate({ productId: product._id, qty }),
      updateQty: (productId, qty) => updateMutation.mutate({ productId, qty }),
      removeItem: (productId) => removeMutation.mutate(productId),
    };
  }

  const items = guestItems.map((i) => {
    const price = i.product.salePrice ?? i.product.price;
    return {
      product: i.product,
      qty: i.qty,
      lineTotal: price * i.qty,
      stockIssue: i.qty > i.product.availableStock ? { availableStock: i.product.availableStock } : null,
    };
  });

  return {
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    isLoading: false,
    addItem: guestAddItem,
    updateQty: guestUpdateQty,
    removeItem: guestRemoveItem,
  };
}
