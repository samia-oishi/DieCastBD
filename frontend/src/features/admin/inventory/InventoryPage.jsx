import { useState } from "react";
import { History, PackagePlus, BellRing } from "lucide-react";

import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminSearch } from "@/features/admin/shell/AdminSearch";
import { AdminThumb } from "@/features/admin/shell/AdminThumb";
import { useAdminInventory } from "./api/useAdminInventory";
import { AdjustStockDialog } from "./components/AdjustStockDialog";
import { HistoryDialog } from "./components/HistoryDialog";
import { RestockAlertsDialog } from "./components/RestockAlertsDialog";

// Prototype grid: 40px thumb | Title | SKU | Stock | Reserved | Available | Alerts | Actions
const GRID = "md:grid-cols-[40px_minmax(200px,1fr)_92px_56px_76px_84px_64px_84px]";

function KpiCard({ label, value, sub, tone }) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-[13px]">
      <div className="text-[11px] font-semibold text-[#6B6E60]">{label}</div>
      <div className="mt-[5px] flex items-baseline gap-[7px]">
        <span className={cn("font-display text-[21px] font-extrabold tracking-[-0.02em]", tone === "amber" ? "text-warn" : "text-ink")}>
          {value}
        </span>
        <span className="text-[11px] text-faint">{sub}</span>
      </div>
    </div>
  );
}

/** Ink-filled when on, per the prototype's toggle-pills. */
function TogglePill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors duration-150",
        active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:bg-tile"
      )}
    >
      {children}
    </button>
  );
}

function IconAction({ label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-[30px] items-center justify-center rounded-[9px] border border-line bg-white text-[#6B6E60] transition-colors hover:border-ink hover:text-ink"
    >
      <Icon size={15} strokeWidth={2} />
    </button>
  );
}

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const [adjusting, setAdjusting] = useState(null);
  const [history, setHistory] = useState(null);
  const [alerts, setAlerts] = useState(null);

  const { data, isLoading } = useAdminInventory({
    page,
    limit: 12,
    q: debouncedSearch || undefined,
    lowStockOnly: lowStockOnly || undefined,
    hasAlerts: hasAlerts || undefined,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const totals = meta?.totals;
  const threshold = meta?.lowStockThreshold ?? 2;

  const resetTo = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader eyebrow="Stock levels" title="Inventory" />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        <KpiCard label="Units in stock" value={totals?.unitsInStock ?? 0} sub={`across ${totals?.skuCount ?? 0} SKUs`} />
        <KpiCard label="Reserved by orders" value={totals?.reserved ?? 0} sub="awaiting dispatch" />
        <KpiCard label="Low / out of stock" value={totals?.lowOrOut ?? 0} sub={`≤ ${threshold} available`} tone="amber" />
        <KpiCard
          label="Restock alerts"
          value={totals?.restockAlerts ?? 0}
          sub="customers waiting"
          tone={totals?.restockAlerts > 0 ? "amber" : undefined}
        />
      </div>

      <div className="flex flex-col gap-3">
        <AdminSearch
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          placeholder="Search title or SKU…"
          className="max-w-md"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <TogglePill active={lowStockOnly} onClick={() => resetTo(setLowStockOnly)(!lowStockOnly)}>
            <span className={cn("size-1.5 rounded-full", lowStockOnly ? "bg-brand-glow" : "bg-warn")} />
            Low stock only (≤ {threshold} available)
          </TogglePill>
          <TogglePill active={hasAlerts} onClick={() => resetTo(setHasAlerts)(!hasAlerts)}>
            Has restock alerts
          </TogglePill>
        </div>
      </div>

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="md:min-w-[900px]">
          <div className={cn("hidden items-center gap-2.5 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid", GRID)}>
            <span />
            <span>Title</span>
            <span>SKU</span>
            <span className="text-right">Stock</span>
            <span className="text-right">Reserved</span>
            <span className="text-right">Available</span>
            <span>Alerts</span>
            <span className="text-right">Actions</span>
          </div>

          {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!isLoading && items.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">No products match — try a different search or filter.</p>
          )}

          {items.map((p) => (
            <div
              key={p.id}
              className={cn(
                "grid grid-cols-[40px_1fr] items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0 md:gap-2.5 md:px-5 md:py-1.5",
                GRID
              )}
            >
              <AdminThumb src={p.thumbnail?.url} alt={p.title} size={32} className="rounded-[8px]" />

              {/* desktop cells */}
              <div className="hidden md:contents">
                <span className="truncate text-[12.5px] font-semibold text-ink" title={p.title}>{p.title}</span>
                <span className="truncate font-display text-[11px] font-bold tracking-[0.02em] text-[#6B6E60]">{p.sku}</span>
                <span className="text-right text-[12.5px] font-bold text-ink">{p.stock}</span>
                <span className="text-right text-[12.5px] text-[#6B6E60]">{p.reservedStock}</span>
                <span className="whitespace-nowrap text-right">
                  <span className={cn("text-[12.5px] font-bold", p.availableStock === 0 ? "text-danger" : p.isLowStock ? "text-warn" : "text-ink")}>
                    {p.availableStock}
                  </span>
                  {p.isLowStock && (
                    <span className="ml-1.5 rounded-full bg-danger-soft px-1.5 py-0.5 text-[9.5px] font-bold text-danger">
                      {p.availableStock === 0 ? "Out" : "Low"}
                    </span>
                  )}
                </span>
                <span>
                  {p.restockAlertCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAlerts(p)}
                      className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-warn-soft px-2.5 text-[11px] font-bold text-warn hover:bg-[#F2DFC7]"
                    >
                      <BellRing size={12} strokeWidth={2.2} /> {p.restockAlertCount}
                    </button>
                  ) : (
                    <span className="text-[12px] text-[#DEDFD6]">—</span>
                  )}
                </span>
                <span className="flex justify-end gap-1.5">
                  <IconAction label="Stock history" icon={History} onClick={() => setHistory(p)} />
                  <IconAction label="Adjust stock" icon={PackagePlus} onClick={() => setAdjusting(p)} />
                </span>
              </div>

              {/* mobile row */}
              <div className="flex items-center gap-3 md:hidden">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-ink">{p.title}</div>
                  <div className="mt-0.5 truncate text-[11px] text-faint">
                    {p.sku} · {p.stock} stock · {p.reservedStock} reserved
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn("text-[13px] font-bold", p.availableStock === 0 ? "text-danger" : p.isLowStock ? "text-warn" : "text-ink")}>
                    {p.availableStock}
                  </span>
                  <IconAction label="Adjust stock" icon={PackagePlus} onClick={() => setAdjusting(p)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-faint">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}

      {adjusting && <AdjustStockDialog product={adjusting} onClose={() => setAdjusting(null)} />}
      {history && <HistoryDialog product={history} onClose={() => setHistory(null)} />}
      {alerts && (
        <RestockAlertsDialog
          product={alerts}
          onClose={() => setAlerts(null)}
          onRestock={() => {
            setAlerts(null);
            setAdjusting(alerts);
          }}
        />
      )}
    </div>
  );
}
