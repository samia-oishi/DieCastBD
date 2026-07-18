import { useState } from "react";
import { Link } from "react-router";
import { Wallet, ShoppingCart, Users, TriangleAlert, Plus, Ticket, ArrowRight } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { StatusChip } from "@/components/shared/StatusChip";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { KpiCard } from "@/features/admin/shell/KpiCard";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { useAnalyticsSummary, useAnalyticsDaily } from "@/features/admin/analytics/api/useAnalytics";
import { useAdminOrders } from "@/features/admin/orders/api/useAdminOrders";
import { useAdminInventory } from "@/features/admin/inventory/api/useAdminInventory";
import { RevenueChart } from "@/features/admin/analytics/components/RevenueChart";
import { useOrderPipeline } from "./useOrderPipeline";

const RANGE_CHIPS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

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

export function DashboardPage() {
  const { data: summary, isLoading } = useAnalyticsSummary();
  const [days, setDays] = useState(30);
  const { data: dailyRows, isLoading: chartLoading } = useAnalyticsDaily(days);
  const { data: recentOrders } = useAdminOrders({ limit: 5 });
  const { data: lowStock } = useAdminInventory({ lowStockOnly: true, limit: 5 });
  const pipeline = useOrderPipeline();

  if (isLoading) return <FullPageLoader />;

  const today = summary?.today;
  const week = summary?.last7Days;
  const rows = dailyRows ?? [];
  const chartRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const chartOrders = rows.reduce((sum, r) => sum + r.ordersCount, 0);

  const orders = recentOrders?.data ?? [];
  const lowItems = lowStock?.data ?? [];
  const lowTotal = lowStock?.meta?.total ?? 0;
  const topProducts = today?.topProducts ?? [];
  const topMax = Math.max(1, ...topProducts.map((p) => p.unitsSold));

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

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} tone="lime" label="Today's revenue" value={formatTaka(today?.revenue ?? 0)} sub={`${today?.ordersCount ?? 0} order${today?.ordersCount === 1 ? "" : "s"} today`} />
        <KpiCard icon={ShoppingCart} label="Last 7 days" value={formatTaka(week?.revenue ?? 0)} sub={`${week?.ordersCount ?? 0} order${week?.ordersCount === 1 ? "" : "s"}`} />
        <KpiCard icon={Users} tone="teal" label="New customers today" value={today?.newCustomers ?? 0} sub={today?.newCustomers ? "Signed up today" : "None yet today"} />
        <KpiCard icon={TriangleAlert} tone="amber" label="Low stock products" value={today?.lowStockCount ?? 0} sub={today?.lowStockCount > 0 ? "≤ 2 units left" : "All healthy"} />
      </div>

      {/* Revenue chart */}
      <SectionPanel
        title="Revenue & orders"
        description={`${formatTaka(chartRevenue)} · ${chartOrders} order${chartOrders === 1 ? "" : "s"} over the last ${days} days`}
        action={
          <div className="flex gap-1.5">
            {RANGE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setDays(chip.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors duration-150",
                  days === chip.value ? "bg-ink text-white" : "text-ink-soft hover:bg-tile"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        }
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
            <SectionPanel title="Top products today" bodyClassName="pt-3">
              <ul className="flex flex-col gap-3">
                {topProducts.map((p) => (
                  <li key={p.product}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <Link to={`/admin/products/${p.product}`} className="min-w-0 truncate text-[12.5px] text-ink hover:text-brand-deep" title={p.title}>
                        {p.title}
                      </Link>
                      <span className="shrink-0 text-[12px] font-bold text-ink-soft">{p.unitsSold} sold</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-tile">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(p.unitsSold / topMax) * 100}%` }} />
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
