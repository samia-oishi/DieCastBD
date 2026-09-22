import { Link } from "react-router";
import { useState, useEffect, useRef } from "react";
import { Trash2, ChevronRight, Truck, RefreshCw, Plus, PackageCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/shared/Pagination";
import { StatusChip } from "@/components/shared/StatusChip";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminSearch } from "@/features/admin/shell/AdminSearch";
import { FilterChips } from "@/features/admin/shell/FilterChips";
import { BulkBar } from "@/features/admin/shell/BulkBar";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useAdminOrders, useDeleteOrdersMutation, useBulkUpdateOrderStatusMutation } from "./api/useAdminOrders";
import { useOrderStatusCounts } from "./api/useOrderStatusCounts";
import { useCourierStatus, useSendToCourierMutation, useSyncCourierMutation } from "./api/useCourier";
import { CourierChip } from "./components/CourierChip";
import { TrustScoreChip } from "./components/TrustScoreChip";
import { SendToCourierDialog } from "./components/SendToCourierDialog";

// Mirrors the backend's stockBucket() "released" set (order.service.js) — used
// only to preview how many units a delete hands back; the backend recomputes the
// authoritative number and we report it from the response.
const RELEASED_STATUSES = ["cancelled", "refunded"];
// "booked" sits right after pending: a customer has taken the item and is
// collecting later. It counts as a sale and holds no reservation — see
// COMMITTED_STATUSES and REVENUE_ORDER_STATUSES on the backend.
const STATUSES = ["pending", "booked", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

// Statuses offered for a bulk change. Refunded is left out on purpose: it is a
// money decision that belongs on the single order, beside its payment history,
// not something to apply to twenty rows at once.
const BULK_STATUSES = ["booked", "confirmed", "packed", "shipped", "delivered", "cancelled"];

// Moving INTO one of these releases every held unit back to sellable stock, so
// a bulk move there is worth spelling out before it runs.
const RELEASING_STATUSES = ["cancelled", "refunded"];

const GRID = "md:grid-cols-[auto_1.2fr_1.5fr_0.9fr_0.8fr_112px_132px_28px]";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const CHECKBOX_CLS = "size-5 rounded-[6px] border-[1.5px] border-[#C9CBBE] data-[state=checked]:border-brand";

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [courierTarget, setCourierTarget] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const showingBooked = status === "booked";
  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    q: debouncedSearch || undefined,
  });
  const counts = useOrderStatusCounts();
  const deleteMutation = useDeleteOrdersMutation();
  const bulkStatusMutation = useBulkUpdateOrderStatusMutation();
  const { data: courier } = useCourierStatus();
  const sendToCourier = useSendToCourierMutation();
  const syncCourier = useSyncCourierMutation();

  const orders = data?.data ?? [];
  const meta = data?.meta;

  // Refresh courier progress when the visible set of parcels changes. Keyed on
  // the ids so paging or filtering re-syncs, while a re-render does not; the
  // backend additionally skips finished parcels and anything checked in the
  // last five minutes, so this stays cheap.
  const sentIds = orders.filter((o) => o.courier?.consignmentId).map((o) => o._id);
  const syncKey = sentIds.join(",");
  const lastSyncKey = useRef(null);
  useEffect(() => {
    if (!courier?.configured || !syncKey || lastSyncKey.current === syncKey) return;
    lastSyncKey.current = syncKey;
    syncCourier.mutate(syncKey.split(","));
    // syncCourier is a stable mutation object; including it would re-fire on
    // every render as its internal state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey, courier?.configured]);
  const selected = orders.filter((o) => selectedIds.includes(o._id));

  // Only live orders (pending = reserved, confirmed..delivered = committed) still
  // hold inventory; cancelled/refunded hold none, so they give nothing back.
  const unitsReturning = selected
    .filter((o) => !RELEASED_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.items.reduce((n, i) => n + i.qty, 0), 0);

  const alreadyAtTarget = pendingStatus ? selected.filter((o) => o.status === pendingStatus).length : 0;

  // Selection is per-page and resets when the visible set changes — you can never
  // delete a row you've scrolled away from.
  const resetTo = (fn) => (value) => {
    fn(value);
    setPage(1);
    setSelectedIds([]);
  };

  const allOnPageSelected = orders.length > 0 && orders.every((o) => selectedIds.includes(o._id));
  const someOnPageSelected = orders.some((o) => selectedIds.includes(o._id));

  const toggleAll = () => setSelectedIds(allOnPageSelected ? [] : orders.map((o) => o._id));
  const toggleOne = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onDelete = () => {
    deleteMutation.mutate(selectedIds, {
      onSuccess: (res) => {
        adminToast(res?.message ?? "Orders deleted");
        setSelectedIds([]);
        setConfirmOpen(false);
      },
      onError: (err) => adminToast(err.response?.data?.message ?? "Could not delete orders"),
    });
  };

  const onBulkStatus = () => {
    bulkStatusMutation.mutate(
      { ids: selectedIds, status: pendingStatus },
      {
        onSuccess: (res) => {
          adminToast(res?.message ?? "Orders updated");
          // Failures are per-order and named, so they get their own line rather
          // than being folded into a count nobody can act on.
          const failed = res?.data?.failed ?? [];
          if (failed.length) {
            adminToast(`${failed[0].orderNumber}: ${failed[0].message}${failed.length > 1 ? ` (+${failed.length - 1} more)` : ""}`);
          }
          setSelectedIds([]);
          setPendingStatus(null);
        },
        onError: (err) => adminToast(err.response?.data?.message ?? "Could not update the orders"),
      }
    );
  };

  const onSendToCourier = () => {
    sendToCourier.mutate(courierTarget._id, {
      onSuccess: (res) => {
        adminToast(res?.courier?.consignmentId ? `Parcel created — consignment ${res.courier.consignmentId}` : "Parcel created");
        setCourierTarget(null);
      },
      onError: (err) => adminToast(err.response?.data?.message ?? "Could not create the parcel"),
    });
  };

  const chips = [
    { value: "all", label: "All", count: counts.all },
    ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: counts[s] })),
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={meta ? `${meta.total} order${meta.total === 1 ? "" : "s"}` : "Orders"}
        title="Orders"
        actions={
          <>
            <AdminButton asChild variant="primary">
              <Link to="new">
                <Plus size={16} strokeWidth={2.4} /> Create order
              </Link>
            </AdminButton>
            {courier?.configured ? (
            <AdminButton
              variant="outline"
              onClick={() => {
                lastSyncKey.current = null;
                syncCourier.mutate(sentIds, {
                  onSuccess: (u) => adminToast(u?.length ? `${u.length} parcel(s) updated` : "All parcels up to date"),
                });
              }}
              disabled={!sentIds.length || syncCourier.isPending}
            >
              <RefreshCw size={15} strokeWidth={2.2} className={syncCourier.isPending ? "animate-spin" : undefined} />
              {syncCourier.isPending ? "Checking…" : "Refresh courier"}
            </AdminButton>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <AdminSearch
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          placeholder="Search by order id, customer, phone or email…"
          className="max-w-md"
        />
        <FilterChips chips={chips} value={status} onChange={resetTo(setStatus)} />
      </div>

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="md:min-w-[720px]">
          {/* header (desktop) */}
          <div className={cn("hidden items-center gap-4 border-b border-line-soft py-2.5 pr-5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid", "border-l-[3px] border-l-transparent pl-[17px]", GRID)}>
            <Checkbox
              className={CHECKBOX_CLS}
              checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              disabled={orders.length === 0}
              aria-label="Select all orders on this page"
            />
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Total</span>
            <span>Status</span>
            <span>Courier</span>
            <span />
          </div>

          {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!isLoading && orders.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">
              {showingBooked ? "Nothing is booked for collection right now." : "No orders match — try a different search or status."}
            </p>
          )}

          {orders.map((o) => {
            const isSel = selectedIds.includes(o._id);
            const isBooked = o.status === "booked";
            return (
              <div
                key={o._id}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-line-soft py-3 pr-4 transition-colors first:border-t-0 hover:bg-[#FCFCF9] md:gap-4 md:pr-5",
                  // The accent lives on a left border that EVERY row carries,
                  // transparent unless the order is booked. Adding the border
                  // only to booked rows would shift their contents 3px and make
                  // the column edges ragged down the table.
                  "border-l-[3px] border-l-transparent pl-[13px] md:pl-[17px]",
                  GRID,
                  isBooked && "border-l-[#0F6B58]",
                  isSel && "bg-[#FBFDF3]"
                )}
              >
                <Checkbox
                  className={cn(CHECKBOX_CLS, "relative z-10")}
                  checked={isSel}
                  onCheckedChange={() => toggleOne(o._id)}
                  aria-label={`Select order ${o.orderNumber}`}
                />

                {/* desktop cells */}
                <div className="hidden md:contents">
                  <Link to={o._id} className="truncate font-display text-[13px] font-bold text-ink hover:text-brand-deep">
                    {o.orderNumber}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] text-ink">{o.user?.name || "Guest"}</span>
                      {/* Only ever what was already checked from the order page.
                          This list must never trigger a lookup: one call per row
                          per open is exactly the pattern that put the API's CPU
                          allowance at its ceiling. */}
                      <TrustScoreChip fraudCheck={o.fraudCheck} />
                    </div>
                    <div className="truncate text-[11.5px] text-faint">{o.phone || o.user?.email || "—"}</div>
                  </div>
                  <div className="text-[12.5px] text-ink-soft">{formatDate(o.createdAt)}</div>
                  <div className="text-[13px] font-bold text-ink">{formatTaka(o.total)}</div>
                  <div><StatusChip status={o.status} size="sm" /></div>
                  <div className="min-w-0">
                    {!courier?.configured ? (
                      <span className="text-[11.5px] text-faint">—</span>
                    ) : o.courier?.consignmentId ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <CourierChip status={o.courier.status} />
                        {o.courier.trackingCode && (
                          <span className="truncate text-[10.5px] text-faint" title={`Consignment ${o.courier.consignmentId}`}>
                            {o.courier.trackingCode}
                          </span>
                        )}
                      </div>
                    ) : ["cancelled", "refunded"].includes(o.status) ? (
                      <span className="text-[11.5px] text-faint">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCourierTarget(o)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-[5px] text-[11px] font-bold text-ink-soft transition-colors hover:border-ink hover:text-ink"
                      >
                        <Truck size={13} strokeWidth={2.2} /> Send
                      </button>
                    )}
                  </div>
                  <Link to={o._id} className="flex justify-end text-faint hover:text-ink">
                    <ChevronRight size={18} strokeWidth={2} />
                  </Link>
                </div>

                {/* mobile card */}
                <Link to={o._id} className="flex items-center gap-3 md:hidden">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[13px] font-bold text-ink">{o.orderNumber}</div>
                    <div className="truncate text-[12px] text-faint">
                      {(o.user?.name || "Guest")} · {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[13px] font-bold text-ink">{formatTaka(o.total)}</span>
                    <StatusChip status={o.status} size="sm" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <SendToCourierDialog
        order={courierTarget}
        open={Boolean(courierTarget)}
        onOpenChange={(o) => !o && setCourierTarget(null)}
        onConfirm={onSendToCourier}
        isPending={sendToCourier.isPending}
      />

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-faint">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => {
              setPage(p);
              setSelectedIds([]);
            }}
          />
        </div>
      )}

      <BulkBar count={selectedIds.length}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* "glass" is the variant built for these dark bars — "outline" is
                border-ink/text-ink, which renders dark-on-dark and all but
                disappears here. Matches the Products bulk bar. */}
            <AdminButton variant="glass" size="sm" disabled={bulkStatusMutation.isPending}>
              <PackageCheck size={15} strokeWidth={2.2} />
              {bulkStatusMutation.isPending ? "Updating…" : "Change status"}
            </AdminButton>
          </DropdownMenuTrigger>
          {/* The bulk bar is z-[60] and DropdownMenuContent defaults to z-50, so
              without this the bar paints over its own menu and clips the last
              item. sideOffset lifts it clear of the bar's edge. */}
          <DropdownMenuContent align="end" side="top" sideOffset={10} className="z-[70] w-52">
            <DropdownMenuLabel>Move {selectedIds.length} order{selectedIds.length === 1 ? "" : "s"} to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {BULK_STATUSES.map((value) => (
              <DropdownMenuItem
                key={value}
                onSelect={() => setPendingStatus(value)}
                className={value === "cancelled" ? "text-destructive focus:text-destructive" : undefined}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <AdminButton variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={15} strokeWidth={2.2} /> Delete
        </AdminButton>
      </BulkBar>

      {/* Status change is reversible, so this confirms rather than warns — but
          it still names the orders, because moving into cancelled hands every
          held unit back to stock and that is not obvious from a menu item. */}
      <AlertDialog open={Boolean(pendingStatus)} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Move {selectedIds.length} order{selectedIds.length === 1 ? "" : "s"} to {pendingStatus}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  {selected.map((o) => (
                    <div key={o._id} className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0">
                      <span className="font-mono">{o.orderNumber}</span>
                      <StatusChip status={o.status} size="sm" />
                    </div>
                  ))}
                </div>
                {alreadyAtTarget > 0 && (
                  <p>
                    {alreadyAtTarget} {alreadyAtTarget === 1 ? "is" : "are"} already {pendingStatus} and will be skipped.
                  </p>
                )}
                {pendingStatus && RELEASING_STATUSES.includes(pendingStatus) && unitsReturning > 0 && (
                  <p className="text-foreground">{unitsReturning} item{unitsReturning === 1 ? "" : "s"} will be returned to stock.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onBulkStatus();
              }}
              disabled={bulkStatusMutation.isPending}
            >
              {bulkStatusMutation.isPending ? "Updating…" : `Move to ${pendingStatus}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} order{selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  {selected.map((o) => (
                    <div key={o._id} className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0">
                      <span className="font-mono">{o.orderNumber}</span>
                      <span className="flex items-center gap-2">
                        <StatusChip status={o.status} size="sm" />
                        <span className="tabular-nums">{formatTaka(o.total)}</span>
                      </span>
                    </div>
                  ))}
                </div>
                {unitsReturning > 0 && (
                  <p className="text-foreground">
                    {unitsReturning} item{unitsReturning === 1 ? "" : "s"} will be returned to stock.
                  </p>
                )}
                <p>This is permanent. These orders will be removed from revenue reports and can&apos;t be recovered from here.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : `Delete ${selectedIds.length} order${selectedIds.length === 1 ? "" : "s"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
