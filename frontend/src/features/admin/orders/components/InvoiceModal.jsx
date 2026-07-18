import { X, Printer } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { StatusChip } from "@/components/shared/StatusChip";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import logo from "@/assets/logo/diecastbdLight.png";

const PAYMENT_METHOD_LABELS = { cod: "Cash on Delivery", bkash: "bKash", banglaqr: "BanglaQR" };

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/** Full-screen invoice dialog. The sheet carries `admin-invoice` so the print CSS
 * (index.css) can show only it; the buttons carry `admin-invoice-hide` to drop
 * out of print. Store contact comes from Settings and renders only when present
 * (no fabricated merchant details). */
export function InvoiceModal({ order, contact, onClose }) {
  const addr = order.shippingAddress;

  // flex-col: the action row stacks ABOVE the sheet. (As a plain `flex` row they
  // sat side by side and squeezed the invoice.)
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center overflow-y-auto bg-[rgba(16,18,8,0.55)] p-5 [backdrop-filter:blur(6px)]">
      <div className="admin-invoice-hide mb-3 flex w-full max-w-[640px] shrink-0 items-center justify-end gap-2">
        <AdminButton variant="primary" size="sm" onClick={() => window.print()}>
          <Printer size={15} strokeWidth={2.2} /> Print
        </AdminButton>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close invoice"
          className="flex size-9 items-center justify-center rounded-full border border-white/25 text-white hover:bg-white/10"
        >
          <X size={17} strokeWidth={2} />
        </button>
      </div>

      <div className="admin-invoice w-full max-w-[640px] shrink-0 rounded-[16px] bg-white p-6 text-ink shadow-[0_20px_60px_rgba(16,18,8,0.4)] sm:p-8">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <img src={logo} alt="DiecastBD" className="mb-2 h-6 w-auto" />
            {contact?.email && <div className="text-[12px] text-ink-soft">{contact.email}</div>}
            {contact?.phone && <div className="text-[12px] text-ink-soft">{contact.phone}</div>}
            {contact?.address && <div className="max-w-[220px] text-[12px] text-ink-soft">{contact.address}</div>}
          </div>
          <div className="text-right">
            <div className="font-display text-[18px] font-extrabold">Invoice</div>
            <div className="mt-1 font-display text-[13px] font-bold">{order.orderNumber}</div>
            <div className="text-[12px] text-faint">{formatDate(order.createdAt)}</div>
            <div className="mt-1.5 flex justify-end">
              <StatusChip status={order.status} size="sm" />
            </div>
          </div>
        </div>

        {/* deliver-to + payment */}
        <div className="mt-6 grid grid-cols-2 gap-6 text-[12.5px]">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-faint">Deliver to</div>
            <div className="font-semibold">{addr.recipientName}</div>
            <div className="text-ink-soft">
              {addr.addressLine1}
              {addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}
              {addr.district && `, ${addr.district}`}
              {addr.postalCode && ` ${addr.postalCode}`}
            </div>
            <div className="text-ink-soft">{addr.phone}</div>
            {order.user?.email && <div className="text-ink-soft">{order.user.email}</div>}
          </div>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-faint">Payment</div>
            <div className="font-semibold">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</div>
            {order.amountPaid > 0 && <div className="text-ink-soft">Paid {formatTaka(order.amountPaid)}</div>}
            {order.amountDue > 0 && <div className="text-ink-soft">Due on delivery {formatTaka(order.amountDue)}</div>}
          </div>
        </div>

        {/* items */}
        <table className="mt-6 w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-y-[1.5px] border-ink text-left">
              <th className="py-2 font-bold">Item</th>
              <th className="py-2 text-center font-bold">Qty</th>
              <th className="py-2 text-right font-bold">Price</th>
              <th className="py-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.sku} className="border-b border-line-soft">
                <td className="py-2 pr-2">{item.title}</td>
                <td className="py-2 text-center">{item.qty}</td>
                <td className="py-2 text-right">{formatTaka(item.price)}</td>
                <td className="py-2 text-right">{formatTaka(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div className="mt-4 flex flex-col items-end gap-1 text-[12.5px]">
          <Row label="Subtotal" value={formatTaka(order.subtotal)} />
          {order.discount > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${formatTaka(order.discount)}`} />}
          <Row label="Shipping" value={order.shippingFee > 0 ? formatTaka(order.shippingFee) : "Free"} />
          <div className="mt-1 flex w-[220px] justify-between border-t-[1.5px] border-ink pt-1.5 font-display text-[15px] font-extrabold">
            <span>Total</span>
            <span>{formatTaka(order.total)}</span>
          </div>
        </div>

        {order.deliveryNote && (
          <div className="mt-5 rounded-[10px] bg-[#FCFCF9] p-3 text-[12px] text-ink-soft">
            <span className="font-semibold text-ink">Note: </span>
            {order.deliveryNote}
          </div>
        )}

        <div className="mt-6 border-t border-line-soft pt-3 text-center text-[11px] text-faint">
          Thank you for shopping with DiecastBD.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex w-[220px] justify-between text-ink-soft">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
