import { cn } from "@/lib/utils";
import { AdminModal } from "@/features/admin/shell/AdminModal";
import { useProductInventoryLogs } from "../api/useAdminInventory";

const TYPE_LABELS = {
  restock: "Restock",
  sale: "Sale",
  reservation: "Reserved",
  release: "Released",
  adjustment: "Adjustment",
};

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}

export function HistoryDialog({ product, onClose }) {
  const { data: logs, isLoading } = useProductInventoryLogs(product.id);

  return (
    <AdminModal title="Stock history" description={product.title} onClose={onClose}>
      {isLoading && <p className="py-6 text-center text-[13px] text-faint">Loading…</p>}
      {!isLoading && logs?.length === 0 && (
        <p className="py-6 text-center text-[13px] text-faint">
          No movements yet — restocks, sales and corrections will show up here.
        </p>
      )}

      <ol className="flex flex-col divide-y divide-line-soft">
        {logs?.map((log) => (
          <li key={log._id} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink">{TYPE_LABELS[log.type] ?? log.type}</div>
              <div className="text-[11.5px] text-faint">
                {formatDateTime(log.createdAt)}
                {log.performedBy?.name && ` · ${log.performedBy.name}`}
                {log.referenceOrder?.orderNumber && ` · ${log.referenceOrder.orderNumber}`}
              </div>
              {log.reason && <div className="mt-0.5 text-[11.5px] text-ink-soft">{log.reason}</div>}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                log.quantityChange > 0 ? "bg-brand-tint text-brand-deep" : "bg-danger-soft text-danger"
              )}
            >
              {log.quantityChange > 0 ? "+" : ""}
              {log.quantityChange}
            </span>
          </li>
        ))}
      </ol>
    </AdminModal>
  );
}
