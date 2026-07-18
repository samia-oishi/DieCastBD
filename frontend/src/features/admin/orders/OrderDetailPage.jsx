import { useState } from "react";
import { useParams, Link } from "react-router";
import { ChevronLeft, MapPin, Printer } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { OrderTracker } from "@/components/shared/OrderTracker";
import { StatusChip } from "@/components/shared/StatusChip";
import { useSettings } from "@/features/settings/api/useSettings";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useAdminOrder, useUpdateOrderStatusMutation } from "./api/useAdminOrders";
import { InvoiceModal } from "./components/InvoiceModal";
import { ROUTES } from "@/constants/routes";

const STATUS_OPTIONS = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_METHOD_LABELS = { cod: "Cash on Delivery", bkash: "bKash", banglaqr: "BanglaQR" };
const PAYMENT_OPTION_LABELS = {
  cod: "Cash on Delivery",
  deliveryOnly: "Delivery charge only",
  partialAdvance: "Partial advance",
  full: "Full payment",
};

/** Optional customer-supplied value — shows "not provided" when blank so a
 * missing field never reads as "this screen doesn't show it". */
function Provided({ value }) {
  return value ? <span className="text-ink">{value}</span> : <span className="italic text-faint">not provided</span>;
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useAdminOrder(id);
  const { data: settings } = useSettings();
  const updateMutation = useUpdateOrderStatusMutation();

  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (isLoading || !order) return <FullPageLoader />;

  const onUpdateStatus = () => {
    if (!nextStatus) return;
    updateMutation.mutate(
      { id, payload: { status: nextStatus, note: note || undefined, trackingNumber: trackingNumber || undefined, courierName: courierName || undefined } },
      {
        onSuccess: () => {
          adminToast("Order status updated");
          setNextStatus("");
          setNote("");
          setTrackingNumber("");
          setCourierName("");
        },
        onError: (err) => adminToast(err.response?.data?.message ?? "Could not update order"),
      }
    );
  };

  const addr = order.shippingAddress;

  return (
    <div className="flex flex-col gap-[18px] pb-10">
      <Link to={`${ROUTES.ADMIN}/orders`} className="flex w-fit items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft size={17} strokeWidth={2.2} /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[24px] font-extrabold tracking-[-0.015em] text-ink md:text-[30px]">{order.orderNumber}</h1>
            <StatusChip status={order.status} />
          </div>
          <p className="mt-1 text-[13px] text-[#6B6E60]">
            {[order.user?.name, order.user?.email, `Placed ${formatDateTime(order.createdAt)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <AdminButton variant="outline" onClick={() => setInvoiceOpen(true)}>
          <Printer size={16} strokeWidth={2.2} /> Print invoice
        </AdminButton>
      </div>

      <SectionPanel>
        <div className="overflow-x-auto">
          <OrderTracker status={order.status} />
        </div>
        {order.trackingNumber && (
          <p className="mt-4 border-t border-line-soft pt-3 text-[12.5px] text-ink-soft">
            <span className="text-faint">Tracking:</span> <span className="font-semibold text-ink">{order.trackingNumber}</span>
            {order.courierName && <span className="text-faint"> via {order.courierName}</span>}
          </p>
        )}
      </SectionPanel>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        {/* Left: items + update status */}
        <div className="flex flex-col gap-[18px]">
          <SectionPanel title="Items" bodyClassName="pt-3">
            <div className="flex flex-col divide-y divide-line-soft">
              {order.items.map((item) => (
                <div key={item.sku} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                  <div className="min-w-0">
                    <div className="text-ink">{item.title}</div>
                    <div className="text-[12px] text-faint">{formatTaka(item.price)} × {item.qty}</div>
                  </div>
                  <span className="shrink-0 font-semibold text-ink">{formatTaka(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-1 border-t border-line-soft pt-3 text-[13px]">
              <Line label="Subtotal" value={formatTaka(order.subtotal)} />
              {order.discount > 0 && <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatTaka(order.discount)}`} tone="lime" />}
              <Line label="Shipping" value={order.shippingFee > 0 ? formatTaka(order.shippingFee) : "Free"} />
              <div className="mt-1 flex justify-between border-t border-line-soft pt-2 font-display text-[15px] font-extrabold text-ink">
                <span>Total</span>
                <span>{formatTaka(order.total)}</span>
              </div>
            </div>

            {/* payment chip + paid/due */}
            <div className="mt-4 rounded-[12px] bg-[#FCFCF9] p-3 text-[12.5px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-tile px-2.5 py-1 text-[11px] font-bold text-ink-soft">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </span>
                {order.paymentOption && (
                  <span className="text-ink-soft">
                    {PAYMENT_OPTION_LABELS[order.paymentOption] ?? order.paymentOption}
                    {order.paymentOption === "partialAdvance" && order.advancePaymentPercent != null && ` (${order.advancePaymentPercent}%)`}
                  </span>
                )}
              </div>
              {order.paymentMethod === "bkash" && order.bkashTransactionId && (
                <p className="mt-1.5 text-faint">Paid from bKash no. ending <span className="font-semibold text-ink">{order.bkashTransactionId}</span></p>
              )}
              {order.paymentMethod === "banglaqr" && order.banglaQrReference && (
                <p className="mt-1.5 text-faint">Paid from account ending <span className="font-semibold text-ink">{order.banglaQrReference}</span></p>
              )}
              {(order.amountPaid > 0 || order.amountDue > 0) && (
                <p className="mt-1.5 text-ink-soft">
                  Paid <span className="font-semibold text-ink">{formatTaka(order.amountPaid)}</span>
                  {order.amountDue > 0 && <> · Due on delivery <span className="font-semibold text-ink">{formatTaka(order.amountDue)}</span></>}
                </p>
              )}
            </div>
          </SectionPanel>

          <SectionPanel title="Update status" bodyClassName="pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">New status</span>
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((s) => s !== order.status).map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Note (optional)</span>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            </div>

            {nextStatus === "shipped" && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12.5px] font-semibold text-ink">Tracking number</span>
                  <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12.5px] font-semibold text-ink">Courier</span>
                  <Input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Pathao, Sundarban…" />
                </label>
              </div>
            )}

            <AdminButton onClick={onUpdateStatus} disabled={!nextStatus || updateMutation.isPending} className="mt-4">
              {updateMutation.isPending ? "Updating…" : "Update status"}
            </AdminButton>
          </SectionPanel>
        </div>

        {/* Right: address + history */}
        <div className="flex flex-col gap-[18px]">
          <SectionPanel
            title={<span className="flex items-center gap-1.5"><MapPin size={16} strokeWidth={2} className="text-brand-deep" /> Shipping address</span>}
            bodyClassName="pt-3 text-[13px] text-ink-soft"
          >
            <p className="font-semibold text-ink">{addr.recipientName}</p>
            <p>
              {addr.addressLine1}
              {addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}
              {addr.district && `, ${addr.district}`}
            </p>
            <p>{addr.phone}</p>
            <p className="mt-1">Postal code: <Provided value={addr.postalCode} /></p>
            <p>Email: <Provided value={order.user?.email} /></p>
            {order.deliveryNote && (
              <div className="mt-3 rounded-[10px] border border-brand-soft-border bg-brand-soft p-3 text-[12.5px] text-ink">
                <span className="font-semibold">Customer note: </span>{order.deliveryNote}
              </div>
            )}
          </SectionPanel>

          <SectionPanel title="Status history" bodyClassName="pt-3">
            <ol className="relative flex flex-col gap-4 pl-5">
              <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-line" aria-hidden />
              {[...order.statusHistory].reverse().map((entry, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-5 top-1 size-[11px] rounded-full border-2 border-white ${i === 0 ? "bg-brand" : "bg-[#C9CBBE]"}`} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold capitalize text-ink">{entry.status}</span>
                    <span className="text-[11.5px] text-faint">{formatDateTime(entry.at)}</span>
                  </div>
                  {entry.note && <p className="mt-0.5 text-[12px] text-ink-soft">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </SectionPanel>
        </div>
      </div>

      {invoiceOpen && <InvoiceModal order={order} contact={settings?.contactInfo} onClose={() => setInvoiceOpen(false)} />}
    </div>
  );
}

function Line({ label, value, tone }) {
  return (
    <div className="flex justify-between">
      <span className="text-faint">{label}</span>
      <span className={tone === "lime" ? "text-brand-deep" : "text-ink-soft"}>{value}</span>
    </div>
  );
}
