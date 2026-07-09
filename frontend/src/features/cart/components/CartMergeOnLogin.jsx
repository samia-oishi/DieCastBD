import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useCartStore } from "@/stores/cartStore";
import { mergeCart } from "../api/cartApi";
import { cartKey } from "../api/useCart";

/** Renders nothing — just watches for the logged-out → logged-in transition
 * and drains the guest cart into the server cart at that moment. Lives in the
 * cart feature (not auth) since cart is what cares about this event. */
export function CartMergeOnLogin() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (user && !wasLoggedIn.current) {
      const guestItems = useCartStore.getState().items;
      if (guestItems.length > 0) {
        mergeCart(guestItems.map((i) => ({ productId: i.product._id, qty: i.qty })))
          .then((cart) => {
            queryClient.setQueryData(cartKey, cart);
            useCartStore.getState().clear();
          })
          .catch(() => {
            // Guest cart stays in localStorage if the merge fails — nothing lost, retried next login.
          });
      }
    }
    wasLoggedIn.current = !!user;
  }, [user, queryClient]);

  return null;
}
