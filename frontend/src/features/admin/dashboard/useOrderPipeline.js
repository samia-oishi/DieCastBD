import { useQueries } from "@tanstack/react-query";
import { listAdminOrders } from "@/features/admin/orders/api/orderApi";

// The order pipeline strip needs a count per fulfillment status. No aggregation
// endpoint exists, so we read meta.total from five parallel `limit:1` count
// queries against the existing orders list (indexed countDocuments — cheap, and
// React Query caches each). Real data, no backend change.
const PIPELINE = ["pending", "confirmed", "packed", "shipped", "delivered"];

export function useOrderPipeline() {
  const results = useQueries({
    queries: PIPELINE.map((status) => ({
      queryKey: ["admin", "orders", "count", status],
      queryFn: () => listAdminOrders({ status, limit: 1 }),
      select: (res) => res.meta?.total ?? 0,
      staleTime: 60 * 1000,
    })),
  });

  return PIPELINE.map((status, i) => ({ status, count: results[i].data ?? 0 }));
}
