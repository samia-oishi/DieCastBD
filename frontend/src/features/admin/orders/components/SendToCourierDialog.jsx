import { Truck } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { formatAddressLine } from "@/lib/address";
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

/** Confirmation before creating a Steadfast consignment.
 *
 * This exists because the action is irreversible from our side: it dispatches a
 * real collection and the only way to undo it is in Steadfast's own panel. It
 * leads with the COD amount, which is the number that costs money if it is
 * wrong — that figure is what the rider will actually collect at the door, and
 * on a partly-prepaid order it is deliberately less than the order total.
 */
export function SendToCourierDialog({ order, open, onOpenChange, onConfirm, isPending }) {
  if (!order) return null;
  const address = order.shippingAddress ?? {};
  const prepaid = (order.amountPaid ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Truck size={17} strokeWidth={2.2} className="text-brand-deep" />
            Send {order.orderNumber} to Steadfast?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This creates a real parcel. Steadfast will collect it, and it can only be cancelled from their panel.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-[12px] border border-line bg-[#FCFCF9] p-3.5 text-[13px] text-ink-soft">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-faint">Collect on delivery</span>
            <span className="font-display text-[19px] font-extrabold text-ink">{formatTaka(order.amountDue ?? 0)}</span>
          </div>
          {prepaid && (
            <p className="mt-1 text-[12px] text-[#B45309]">
              {formatTaka(order.amountPaid)} already paid — the rider collects the remainder, not the {formatTaka(order.total)} total.
            </p>
          )}
          <div className="mt-3 border-t border-line-soft pt-2.5">
            <div className="font-semibold text-ink">{address.recipientName}</div>
            <div>{formatAddressLine(address)}</div>
            <div>{address.phone}</div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Creating…" : "Create parcel"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
