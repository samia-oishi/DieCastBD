import { useState } from "react";
import { Link } from "react-router";
import { DollarSign, BarChart3, UserPlus, TriangleAlert, Plus, Ticket, ArrowRight, ShoppingBag, TrendingUp, Clock, Boxes } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { StatusChip } from "@/components/shared/StatusChip";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { KpiCard } from "@/features/admin/shell/KpiCard";
import { FilterChips } from "@/features/admin/shell/FilterChips";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { useAnalyticsSummary, useAnalyticsDaily } from "@/features/admin/analytics/api/useAnalytics";
import { useAdminOrders } from "@/features/admin/orders/api/useAdminOrders";
import { useAdminInventory } from "@/features/admin/inventory/api/useAdminInventory";
import { RevenueChart } from "@/features/admin/analytics/components/RevenueChart";
import { useOrderPipeline } from "./useOrderPipeline";

// One control for the whole page: the KPI row and the chart both read this.
// `days` is what the chart's daily-history query wants; `range` is what the
// summary endpoint wants. Today has no meaningful multi-day chart, so it
// borrows the 7-day series while the KPIs show just today.
const RANGE_CHIPS = [
  { value: "today", label: "Today", days: 7 },
  { value: "7", label: "7 days", days: 7 },
  { value: "30", label: "30 days", days: 30 },
  { value: "90", label: "90 days", days: 90 },
];

const RANGE_NOUN = {
  today: "today",
  7: "in the last 7 days",
  30: "in the last 30 days",
  90: "in the last 90 days",
};

const PRIOR_LABEL = { today: "vs yesterday", 7: "vs prior week", 30: "vs prior month", 90: "vs prior quarter" };

const PIPELINE_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

function initials(name, email) {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function todayEyebrow() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Period-over-period delta, computed from REAL prior-window figures the
 * summary endpoint returns (it was assembled here from daily rows before; the
 * server does it now, so the comparison window always matches the chip). When the
 * prior period had zero revenue a percentage is undefined, so it shows a plain
 * "▲ vs …" growth marker instead of a fabricated number; nothing when both are 0. */
function DeltaPill({ current, prior, period }) {
  if (prior > 0) {
    const pct = Math.round(((current - prior) / prior) * 100);
    const up = pct >= 0;
    return (
      <span className={cn("inline-block rounded-full px-2 py-[3px] text-[11px] font-bold", up ? "bg-brand-tint text-brand-deep" : "bg-[#FDF3E7] text-[#B45309]")}>
        {up ? "+" : ""}{pct}% {period}
      </span>
    );
  }
  if (current > 0) {
    return <span className="inline-block rounded-full bg-brand-tint px-2 py-[3px] text-[11px] font-bold text-brand-deep">▲ {period}</span>;
  }
  return null;
}

export function DashboardPage() {
  const [range, setRange] = useState("today");
  const chip = RANGE_CHIPS.find((c) => c.value === range) ?? RANGE_CHIPS[0];

  const { data: summary, isLoading } = useAnalyticsSummary(range);
  const { data: dailyRows, isLoading: chartLoading } = useAnalyticsDaily(chip.days);
  const { data: recentOrders } = useAdminOrders({ limit: 5 });
  const { data: lowStock } = useAdminInventory({ lowStockOnly: true, limit: 5 });
  const pipeline = useOrderPipeline();

  if (isLoading && !summary) return <FullPageLoader />;

  // Every money figure comes from the summary endpoint, which reads orders
  // live — so a confirmation made a second ago is already reflected, without
  // waiting for the nightly rollup.
  const s = summary ?? {};
  const prior = s.prior ?? {};
  const profit = (s.revenue ?? 0) - (s.cogs ?? 0);
  const margin = s.revenue ? Math.round((profit / s.revenue) * 1000) / 10 : null;
  const rows = dailyRows ?? [];
  const chartRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const chartOrders = rows.reduce((sum, r) => sum + r.ordersCount, 0);

  const orders = recentOrders?.data ?? [];
  const lowItems = lowStock?.data ?? [];
  const lowTotal = lowStock?.meta?.total ?? 0;
  const topProducts = s.topProducts ?? [];
  const topMax = Math.max(1, ...topProducts.map((p) => Math.abs(p.profit ?? 0)));

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={todayEyebrow()}
        title="Dashboard"
        actions={
          <>
            <AdminButton asChild variant="primary">
              <Link to="/admin/products/new">
                <Plus size={16} strokeWidth={2.4} /> Add product
              </Link>
            </AdminButton>
            <AdminButton asChild variant="outline">
              <Link to="/admin/coupons">
                <Ticket size={16} strokeWidth={2.2} /> Create coupon
              </Link>
            </AdminButton>
          </>
        }
      />

      {/* One range control for the whole page */}
      <FilterChips chips={RANGE_CHIPS} value={range} onChange={setRange} />

      {/* Money row. Total sales is what customers paid; revenue takes off the
          delivery charge the courier keeps; profit takes off what the goods
          cost us. Three different numbers that used to be one. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ShoppingBag}
          label="Total sales"
          value={formatTaka(s.totalSales ?? 0)}
          delta={<DeltaPill current={s.totalSales ?? 0} prior={prior.totalSales ?? 0} period={PRIOR_LABEL[range]} />}
          sub={`incl. ${formatTaka(s.shippingFees ?? 0)} delivery collected`}
        />
        <KpiCard
          icon={DollarSign}
          tone="lime"
          label="Revenue"
          value={formatTaka(s.revenue ?? 0)}
          delta={<DeltaPill current={s.revenue ?? 0} prior={prior.revenue ?? 0} period={PRIOR_LABEL[range]} />}
          sub="after delivery charge"
        />
        <KpiCard
          icon={TrendingUp}
          tone={profit < 0 ? "red" : "lime"}
          label="Profit"
          value={formatTaka(profit)}
          delta={<DeltaPill current={profit} prior={prior.profit ?? 0} period={PRIOR_LABEL[range]} />}
          sub={
            s.unitsMissingCost > 0
              ? `${s.unitsMissingCost} unit${s.unitsMissingCost === 1 ? "" : "s"} without a cost price`
              : margin != null
                ? `${margin}% margin · ${formatTaka(s.cogs ?? 0)} cost`
                : "No sales yet"
          }
        />
        <KpiCard
          icon={BarChart3}
          label="Orders"
          value={s.ordersCount ?? 0}
          delta={<DeltaPill current={s.ordersCount ?? 0} prior={prior.ordersCount ?? 0} period={PRIOR_LABEL[range]} />}
          sub={`${s.unitsSold ?? 0} item${s.unitsSold === 1 ? "" : "s"} sold ${RANGE_NOUN[range]}`}
        />
      </div>

      {/* Operational row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Clock}
          tone="amber"
          label="Awaiting confirmation"
          value={formatTaka(s.pending?.value ?? 0)}
          delta={
            s.pending?.count > 0 ? (
              <Link
                to="/admin/orders?status=pending"
                className="inline-block rounded-full bg-[#FDF3E7] px-2 py-[3px] text-[11px] font-bold text-[#B45309] hover:bg-[#FBE8D0]"
              >
                Review {s.pending.count} order{s.pending.count === 1 ? "" : "s"}
              </Link>
            ) : null
          }
          sub={s.pending?.count > 0 ? "Not counted as sales until confirmed" : "Nothing waiting"}
        />
        <KpiCard
          icon={Boxes}
          label="Stock at cost"
          value={formatTaka(s.inventory?.atCost ?? 0)}
          sub={`${s.inventory?.unitsInStock ?? 0} units · ${formatTaka(s.inventory?.atRetail ?? 0)} at retail`}
        />
        <KpiCard
          icon={UserPlus}
          tone="teal"
          label="New customers"
          value={s.newCustomers ?? 0}
          sub={RANGE_NOUN[range]}
        />
        <KpiCard
          icon={TriangleAlert}
          tone="amber"
          label="Low stock products"
          value={s.lowStockCount ?? 0}
          delta={
            s.lowStockCount > 0 ? (
              <span className="inline-block rounded-full bg-[#FDF3E7] px-2 py-[3px] text-[11px] font-bold text-[#B45309]">Needs restock</span>
            ) : null
          }
          sub={s.lowStockCount > 0 ? "≤ 2 units left" : "All healthy"}
        />
      </div>

      {/* Revenue chart — follows the same range chip as the KPIs above */}
      <SectionPanel
        title="Revenue & orders"
        description={`${formatTaka(chartRevenue)} · ${chartOrders} order${chartOrders === 1 ? "" : "s"} over the last ${chip.days} days`}
      >
        {chartLoading ? (
          <div className="flex h-60 items-center justify-center text-sm text-faint">Loading…</div>
        ) : (
          <RevenueChart data={rows} />
        )}
      </SectionPanel>

      {/* Two-column: recent orders / right rail */}
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.5fr_1fr]">
        <SectionPanel
          title="Recent orders"
          action={
            <Link to="/admin/orders" className="text-[12.5px] font-semibold text-brand-deep hover:text-[#5F7A10]">
              View all
            </Link>
          }
          bodyClassName="p-0"
        >
          {orders.length === 0 ? (
            <p className="px-[22px] py-8 text-center text-[13.5px] text-faint">No orders yet.</p>
          ) : (
            <ul>
              {orders.map((o) => (
                <li key={o._id} className="border-t border-line-soft first:border-t-0">
                  <Link to={`/admin/orders/${o._id}`} className="flex items-center gap-3 px-[22px] py-3 transition-colors hover:bg-[#FCFCF9]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tile text-[11.5px] font-bold text-ink-soft">
                      {initials(o.user?.name, o.user?.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[13px] font-bold text-ink">{o.orderNumber}</div>
                      <div className="truncate text-[12px] text-faint">
                        {o.user?.name || o.user?.email || "Guest"} · {o.items?.length ?? 0} item{o.items?.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="text-[13px] font-bold text-ink">{formatTaka(o.total)}</span>
                      <StatusChip status={o.status} size="sm" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionPanel>

        <div className="flex flex-col gap-[18px]">
          <SectionPanel
            title="Low stock"
            action={
              <span className="rounded-full bg-[#FDF3E7] px-2.5 py-1 text-[10.5px] font-bold text-[#B45309]">{lowTotal} item{lowTotal === 1 ? "" : "s"}</span>
            }
            bodyClassName="pt-3"
          >
            {lowItems.length === 0 ? (
              <p className="py-2 text-[13px] text-faint">Everything is well stocked.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {lowItems.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[12.5px] text-ink" title={it.title}>{it.title}</span>
                    <span className={cn("shrink-0 text-[12.5px] font-bold", it.availableStock <= 1 ? "text-[#B3261E]" : "text-[#B45309]")}>
                      {it.availableStock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <AdminButton asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/admin/inventory">
                Open inventory <ArrowRight size={15} strokeWidth={2.2} />
              </Link>
            </AdminButton>
          </SectionPanel>

          {topProducts.length > 0 && (
            /* Ranked by profit, not units — a cheap bestseller can top the
               volume chart while earning the least in the catalogue. */
            <SectionPanel title="Top products by profit" bodyClassName="pt-3">
              <ul className="flex flex-col gap-3">
                {topProducts.map((p) => (
                  <li key={p.product}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <Link to={`/admin/products/${p.product}`} className="min-w-0 truncate text-[12.5px] text-ink hover:text-brand-deep" title={p.title}>
                        {p.title}
                      </Link>
                      <span className={cn("shrink-0 text-[12px] font-bold", p.profit < 0 ? "text-[#B3261E]" : "text-ink")}>
                        {formatTaka(p.profit ?? 0)}
                      </span>
                    </div>
                    <div className="mb-1 text-[11px] text-faint">
                      {p.unitsSold} sold · {formatTaka(p.revenue ?? 0)} revenue
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-tile">
                      <div
                        className={cn("h-full rounded-full", p.profit < 0 ? "bg-[#B3261E]" : "bg-brand")}
                        style={{ width: `${(Math.abs(p.profit ?? 0) / topMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </SectionPanel>
          )}
        </div>
      </div>

      {/* Order pipeline */}
      <SectionPanel title="Order pipeline" bodyClassName="pt-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {pipeline.map(({ status, count }) => (
            <Link
              key={status}
              to={`/admin/orders?status=${status}`}
              className="rounded-[12px] border border-line bg-[#FCFCF9] px-4 py-3 transition-colors hover:border-ink"
            >
              <div className="font-display text-[22px] font-extrabold text-ink">{count}</div>
              <div className="mt-0.5 text-[11.5px] font-semibold text-faint">{PIPELINE_LABELS[status]}</div>
            </Link>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}
