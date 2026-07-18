import { useQueries } from "@tanstack/react-query";
import { listAdminOrders } from "./orderApi";

// Per-status counts for the Orders filter chips. No aggregation endpoint exists,
// so each count is meta.total from a `limit:1` query against the existing list
// (indexed countDocuments — cheap, cached, parallel). Independent of the active
// search so the badges show the full catalogue counts.
const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

export function useOrderStatusCounts() {
  const results = useQueries({
    queries: [
      { queryKey: ["admin", "orders", "count", "all"], queryFn: () => listAdminOrders({ limit: 1 }), select: (r) => r.meta?.total ?? 0, staleTime: 60_000 },
      ...STATUSES.map((status) => ({
        queryKey: ["admin", "orders", "count", status],
        queryFn: () => listAdminOrders({ status, limit: 1 }),
        select: (r) => r.meta?.total ?? 0,
        staleTime: 60_000,
      })),
    ],
  });

  const counts = { all: results[0].data ?? 0 };
  STATUSES.forEach((status, i) => {
    counts[status] = results[i + 1].data ?? 0;
  });
  return counts;
}
