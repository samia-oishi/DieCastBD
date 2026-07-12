import { Link } from "react-router";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { ROUTES } from "@/constants/routes";
import { StatusChip } from "@/components/shared/StatusChip";
import { OrderTracker } from "@/components/shared/OrderTracker";
import { useSettings } from "@/features/settings/api/useSettings";

const PAYMENT_LABELS = { cod: "Cash on Delivery", bkash: "bKash", banglaqr: "BanglaQR" };

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function OrderItems({ order }) {
  return (
    <div className="rounded-[18px] border border-line bg-white p-4 md:rounded-[20px] md:p-[22px]">
      <div className="hidden font-display text-base font-bold text-ink md:block">Items</div>
      <div className="md:mt-4">
        {order.items.map((item, i) => (
          <div
            key={item.sku ?? i}
            className={cn("flex items-center gap-2.5 md:gap-3.5", i > 0 && "mt-3 border-t border-tile pt-3 md:mt-3.5 md:pt-3.5")}
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-[10px] bg-tile md:h-[58px] md:w-16 md:rounded-[12px]">
              {item.thumbnail?.url && <img src={cloudinaryCard(item.thumbnail.url)} alt="" className="size-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[12.5px] font-semibold leading-[1.3] text-ink md:text-sm">{item.title}</div>
              <div className="mt-0.5 text-[11.5px] text-faint md:text-[12.5px]">Qty {item.qty}</div>
            </div>
            <span className="text-[13px] font-bold text-ink md:text-[14.5px]">{formatTaka(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      {/* Mobile-only inline total (desktop uses the Summary card) */}
      <div className="mt-3 flex items-center justify-between border-t border-tile pt-3 md:hidden">
        <span className="text-[12px] text-faint">
          Subtotal {formatTaka(order.subtotal)} · Shipping {order.shippingFee > 0 ? formatTaka(order.shippingFee) : "Free"}
        </span>
        <span className="font-display text-[15px] font-extrabold text-ink">{formatTaka(order.total)}</span>
      </div>
    </div>
  );
}

function AddressCard({ order, zoneName }) {
  const a = order.shippingAddress;
  return (
    <div className="flex gap-3 rounded-[18px] border border-line bg-white p-4 md:rounded-[20px] md:p-[22px]">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#EFF5DC] text-brand-deep md:size-[38px]">
        <MapPin size={16} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-bold text-ink md:text-sm">
          {a.recipientName} · {a.phone}
        </div>
        <div className="mt-1 text-[11.5px] leading-[1.55] text-ink-soft md:text-[13px]">
          {a.addressLine1}, {a.city}
          {a.district && `, ${a.district}`}
          {a.postalCode && ` ${a.postalCode}`}
          {zoneName && (
            <>
              <br />
              {zoneName}
            </>
          )}
        </div>
        {order.deliveryNote && <div className="mt-1.5 text-[11.5px] text-faint md:text-[12.5px]">Note: {order.deliveryNote}</div>}
      </div>
    </div>
  );
}

function OrderButtons({ className }) {
  return (
    <div className={className}>
      <Link
        to={ROUTES.ORDERS}
        className="flex h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-[#2A2E1C]"
      >
        View my orders
      </Link>
      <Link
        to={ROUTES.SHOP}
        className="mt-2.5 flex h-[46px] items-center justify-center rounded-full border-[1.5px] border-ink text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
      >
        Continue shopping
      </Link>
    </div>
  );
}

function SummaryCard({ order, paymentLabel }) {
  return (
    <div className="rounded-[20px] border border-line bg-white p-[22px]">
      <div className="font-display text-base font-bold text-ink">Summary</div>
      <div className="mt-4 flex justify-between text-[13.5px]">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold text-ink">{formatTaka(order.subtotal)}</span>
      </div>
      {order.discount > 0 && (
        <div className="mt-[11px] flex justify-between text-[13.5px]">
          <span className="text-muted-foreground">Discount {order.couponCode && `(${order.couponCode})`}</span>
          <span className="font-semibold text-brand-deep">−{formatTaka(order.discount)}</span>
        </div>
      )}
      <div className="mt-[11px] flex justify-between text-[13.5px]">
        <span className="text-muted-foreground">Shipping</span>
        <span className="font-semibold text-ink">{order.shippingFee > 0 ? formatTaka(order.shippingFee) : "Free"}</span>
      </div>
      <div className="mt-3.5 flex items-baseline justify-between border-t border-line-soft pt-3.5">
        <span className="text-[14.5px] font-bold text-ink">Total</span>
        <span className="font-display text-[20px] font-extrabold text-ink">{formatTaka(order.total)}</span>
      </div>
      <div className="mt-3 flex justify-between text-[13px]">
        <span className="text-muted-foreground">Payment</span>
        <span className="font-semibold text-ink">{paymentLabel}</span>
      </div>
      <OrderButtons className="mt-5" />
    </div>
  );
}

/** The full order display (head + tracker + items + address + summary), matching
 * the Order Placed design — shared by the guest-safe confirmation page (renders
 * straight from the just-placed order, no fetch) and the authenticated order
 * detail page, so the two never drift. */
export function OrderReceipt({ order }) {
  const { data: settings } = useSettings();
  const zoneName = settings?.shippingZones?.find((z) => z.fee === order.shippingFee)?.name;
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;

  return (
    <>
      {/* Order head + tracker */}
      <div className="rounded-[18px] border border-line bg-white p-[18px] md:rounded-[24px] md:p-[26px_30px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-[14.5px] font-bold text-ink md:text-[19px]">
              <span className="hidden md:inline">Order </span>
              {order.orderNumber}
            </div>
            <div className="mt-1 text-[11.5px] text-faint md:text-[13px]">
              {formatDate(order.createdAt)} · {paymentLabel}
            </div>
          </div>
          <StatusChip status={order.status} />
        </div>
        <div className="mt-5 md:mt-[26px]">
          <OrderTracker status={order.status} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-[1.55fr_1fr] md:items-start md:gap-6">
        <div className="flex flex-col gap-3 md:gap-4">
          <OrderItems order={order} />
          <AddressCard order={order} zoneName={zoneName} />
          <OrderButtons className="md:hidden" />
        </div>
        <div className="hidden md:block">
          <SummaryCard order={order} paymentLabel={paymentLabel} />
        </div>
      </div>
    </>
  );
}
