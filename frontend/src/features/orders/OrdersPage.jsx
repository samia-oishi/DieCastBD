import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, PackageSearch } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { ROUTES } from "@/constants/routes";
import { Seo } from "@/components/shared/Seo";
import { StatusChip } from "@/components/shared/StatusChip";
import { useCart } from "@/features/cart/api/useCart";
import { useMyOrders } from "./api/useOrders";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES = ["pending", "confirmed", "packed", "shipped"];

function matchesFilter(order, filter) {
  if (filter === "all") return true;
  if (filter === "active") return ACTIVE_STATUSES.includes(order.status);
  if (filter === "delivered") return order.status === "delivered";
  if (filter === "cancelled") return order.status === "cancelled" || order.status === "refunded";
  return true;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function ctaFor(status) {
  if (status === "delivered") return { label: "Buy again", kind: "buyAgain" };
  if (status === "cancelled" || status === "refunded") return { label: "Details", kind: "details" };
  return { label: "Track order", kind: "track" };
}

function OrderCard({ order }) {
  const { addItem } = useCart();
  const to = `/orders/${order.orderNumber}`;
  const names = order.items.map((i) => i.title).join(", ");
  const count = order.items.length;
  const summary = `${formatDate(order.createdAt)} · ${count} item${count !== 1 ? "s" : ""} — ${names}`;
  const cta = ctaFor(order.status);

  const onBuyAgain = (e) => {
    e.preventDefault();
    order.items.forEach((i) => addItem({ _id: i.product }, i.qty));
    toast.success("Added to your cart");
  };

  return (
    <>
      {/* Desktop row */}
      <Link
        to={to}
        className="hidden items-center gap-5 rounded-[20px] border border-line bg-white p-[20px_22px] transition-[box-shadow,transform] duration-[180ms] hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(16,18,8,0.08)] md:flex"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold text-ink">{order.orderNumber}</span>
            <StatusChip status={order.status} size="sm" />
          </div>
          <div className="mt-1.5 line-clamp-1 text-[13px] text-faint">{summary}</div>
        </div>
        <span className="font-display text-lg font-extrabold text-ink">{formatTaka(order.total)}</span>
        <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-faint" />
      </Link>

      {/* Mobile card */}
      <Link to={to} className="block rounded-[18px] border border-line bg-white p-4 md:hidden">
        <div className="flex items-center justify-between gap-2.5">
          <span className="font-display text-sm font-bold text-ink">{order.orderNumber}</span>
          <StatusChip status={order.status} size="sm" />
        </div>
        <div className="mt-1.5 text-[11.5px] leading-[1.5] text-faint">
          {formatDate(order.createdAt)} · {count} item{count !== 1 ? "s" : ""}
          <br />
          <span className="line-clamp-1">{names}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-tile pt-[11px]">
          <span className="font-display text-[15.5px] font-extrabold text-ink">{formatTaka(order.total)}</span>
          {cta.kind === "buyAgain" ? (
            <button type="button" onClick={onBuyAgain} className="text-[12px] font-bold text-brand-deep">
              {cta.label} →
            </button>
          ) : (
            <span className={cn("text-[12px] font-bold", cta.kind === "details" ? "text-faint" : "text-brand-deep")}>
              {cta.label} →
            </span>
          )}
        </div>
      </Link>
    </>
  );
}

function FilterChips({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 md:flex-wrap">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={cn(
            "flex-none rounded-full px-[18px] py-2.5 text-[12.5px] font-semibold transition-colors md:text-[13px]",
            value === f.key ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <PackageSearch className="size-10 text-faint/40" strokeWidth={1.25} />
      <p className="text-sm text-muted-foreground">No orders here yet.</p>
      <Link to={ROUTES.SHOP} className="rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright">
        Browse the collection
      </Link>
    </div>
  );
}

export function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();
  const [filter, setFilter] = useState("all");

  const visible = (orders ?? []).filter((o) => matchesFilter(o, filter));

  return (
    <>
      <Seo title="My orders" noindex />
      <div className="mx-auto w-full max-w-[1060px] px-4 pb-6 pt-6 md:px-10 md:pb-10 md:pt-10">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.01em] text-ink md:text-[34px] md:tracking-[-0.02em]">My orders</h1>
        <p className="mt-1.5 hidden text-[14.5px] text-muted-foreground md:block">Track, review, or reorder — every piece you've claimed.</p>

        <div className="mt-4 md:mt-[22px]">
          <FilterChips value={filter} onChange={setFilter} />
        </div>

        {isLoading ? (
          <div className="mt-5 flex flex-col gap-3 md:mt-[22px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[86px] w-full animate-pulse rounded-[18px] bg-line-soft md:h-20 md:rounded-[20px]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-3 flex flex-col gap-3 md:mt-[22px] md:gap-3.5">
            {visible.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
