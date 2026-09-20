import { useQueries } from "@tanstack/react-query";
import { listAdminOrders } from "@/features/admin/orders/api/orderApi";

// The order pipeline strip needs a count per order status. No aggregation
// endpoint exists, so we read meta.total from one `limit:1` count query per
// status, in parallel (indexed countDocuments — cheap, and React Query caches
// each). Real data, no backend change.
// "cancelled" is not a pipeline stage — it is where orders leave the pipeline —
// but it was the one order state the dashboard never showed at all. On a shop
// that is ~76% cash-on-delivery, the cancel count is the number that says
// whether COD is worth running, so it belongs on this strip rather than nowhere.
const PIPELINE = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

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
