import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { useRestockAlertStore } from "@/stores/restockAlertStore";

async function createRestockAlert({ productId, contact }) {
  const { data } = await api.post(`/products/${productId}/restock-alert`, { contact });
  return data;
}

/** Subscribe a "notify me when back in stock" alert. The backend treats a
 * duplicate {product, contact} as an idempotent success, so we don't special-case
 * it here. On success we mark the product locally so the card shows "✓ Alert set". */
export function useRestockAlertMutation(productId) {
  const markAlerted = useRestockAlertStore((s) => s.markAlerted);
  return useMutation({
    mutationFn: (contact) => createRestockAlert({ productId, contact }),
    onSuccess: () => markAlerted(productId),
  });
}
