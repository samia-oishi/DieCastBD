import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { adminInputCls } from "@/features/admin/shell/adminFieldCls";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";

/** Records money that arrived outside checkout — the Facebook/Messenger case,
 * where a customer sends part of the payment by bKash and agrees a discount in
 * conversation.
 *
 * The merchant types the advance they RECEIVED and the COD follows, which is
 * the direction they actually think in ("he sent me 500"). The live preview
 * exists because that subtraction is the number a rider will collect at a
 * stranger's door, and it should never be arithmetic done in someone's head.
 */
export function AdjustPaymentDialog({ order, open, onOpenChange, onSubmit, isPending }) {
  const [advance, setAdvance] = useState("");
  const [discount, setDiscount] = useState("");
  const [reason, setReason] = useState("");

  // Reset to the order's current values each time it opens, so the fields
  // always show what is true right now rather than a stale edit.
  useEffect(() => {
    if (!open || !order) return;
    setAdvance(String(order.amountPaid ?? 0));
    setDiscount(String(order.discount ?? 0));
    setReason("");
  }, [open, order]);

  if (!order) return null;

  const num = (v) => (v === "" ? 0 : Number(v));
  const nextDiscount = num(discount);
  const nextTotal = (order.subtotal ?? 0) - nextDiscount + (order.shippingFee ?? 0);
  const nextAdvance = num(advance);
  const nextDue = nextTotal - nextAdvance;

  const overDiscount = nextDiscount > (order.subtotal ?? 0);
  const overAdvance = nextAdvance > nextTotal;
  const invalid = overDiscount || overAdvance || nextDiscount < 0 || nextAdvance < 0;
  const alreadySent = Boolean(order.courier?.consignmentId);

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={`Adjust payment · ${order.orderNumber}`}>
      <div className="flex flex-col gap-4">
        {alreadySent && (
          /* Steadfast has no endpoint to update a parcel after creation, so our
             number and theirs will disagree unless the merchant edits both. */
          <div className="flex gap-2.5 rounded-[12px] border border-[#F0D9B5] bg-[#FDF8EF] p-3 text-[12.5px] text-[#8A5A12]">
            <TriangleAlert size={16} strokeWidth={2.2} className="mt-px shrink-0" />
            <span>
              This parcel is already with Steadfast (consignment {order.courier.consignmentId}). Changing the amount here
              does <strong>not</strong> change it at Steadfast — update it in their panel too, or the rider will collect
              the old amount.
            </span>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink">Advance received</div>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            value={advance}
            onChange={(e) => setAdvance(e.target.value)}
            className={adminInputCls}
            placeholder="0"
          />
          <p className="mt-1 text-[11.5px] text-faint">What the customer has already sent you, e.g. by bKash.</p>
          {overAdvance && <p className="mt-1 text-[11.5px] text-danger">More than the {formatTaka(nextTotal)} total.</p>}
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink">Discount</div>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className={adminInputCls}
            placeholder="0"
          />
          {overDiscount && (
            <p className="mt-1 text-[11.5px] text-danger">More than the {formatTaka(order.subtotal)} subtotal.</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink">Reason <span className="font-medium text-faint">(optional)</span></div>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={adminInputCls}
            placeholder="e.g. Messenger deal, bKash advance"
            maxLength={200}
          />
          <p className="mt-1 text-[11.5px] text-faint">Saved to this order&apos;s history so you can see why later.</p>
        </div>

        <div className="rounded-[12px] border border-line bg-[#FCFCF9] p-3.5 text-[13px]">
          <Row label="Subtotal" value={formatTaka(order.subtotal ?? 0)} />
          <Row label="Discount" value={`−${formatTaka(nextDiscount)}`} />
          <Row label="Delivery" value={formatTaka(order.shippingFee ?? 0)} />
          <Row label="Total" value={formatTaka(nextTotal)} strong />
          <Row label="Advance received" value={`−${formatTaka(nextAdvance)}`} />
          <div className="mt-1.5 flex items-baseline justify-between border-t border-line-soft pt-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-faint">Rider collects</span>
            <span className={`font-display text-[19px] font-extrabold ${invalid ? "text-danger" : "text-ink"}`}>
              {formatTaka(Math.max(0, nextDue))}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-1">
          <AdminButton variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</AdminButton>
          <AdminButton
            variant="primary"
            disabled={invalid || isPending}
            onClick={() => onSubmit({ advanceReceived: nextAdvance, discount: nextDiscount, reason: reason.trim() || undefined })}
          >
            {isPending ? "Saving…" : "Save"}
          </AdminButton>
        </div>
      </div>
    </ResponsiveModal>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between ${strong ? "mt-1 border-t border-line-soft pt-1.5 font-semibold text-ink" : "text-ink-soft"}`}>
      <span className={strong ? "" : "text-faint"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
