import { AdminModal } from "@/features/admin/shell/AdminModal";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { useProductRestockAlerts } from "../api/useAdminInventory";

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}

export function RestockAlertsDialog({ product, onClose, onRestock }) {
  const { data: alerts, isLoading } = useProductRestockAlerts(product.id);
  const waiting = alerts?.filter((a) => !a.notifiedAt) ?? [];

  return (
    <AdminModal
      title="Restock alerts"
      description={product.title}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11.5px] text-faint">
            Notified automatically once available stock goes above zero.
          </span>
          <AdminButton type="button" onClick={onRestock}>Restock this item</AdminButton>
        </div>
      }
    >
      {isLoading && <p className="py-6 text-center text-[13px] text-faint">Loading…</p>}
      {!isLoading && alerts?.length === 0 && (
        <p className="py-6 text-center text-[13px] text-faint">No one's waiting on this one yet.</p>
      )}

      {alerts?.length > 0 && (
        <>
          <p className="mb-2 text-[12.5px] text-ink-soft">
            {waiting.length} waiting{alerts.length !== waiting.length && ` · ${alerts.length - waiting.length} already notified`}
          </p>
          <ul className="flex flex-col divide-y divide-line-soft">
            {alerts.map((alert) => (
              <li key={alert._id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-[12.5px] text-ink">{alert.contact}</span>
                <span className="shrink-0 text-[11.5px] text-faint">
                  {alert.notifiedAt ? `Notified ${formatDateTime(alert.notifiedAt)}` : `Since ${formatDateTime(alert.createdAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminModal>
  );
}
