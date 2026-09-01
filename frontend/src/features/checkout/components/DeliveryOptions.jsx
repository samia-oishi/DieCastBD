import { MapPin, Truck } from "lucide-react";

import { formatTaka } from "@/lib/currency";

/** The delivery zone, derived from the district on the address rather than
 * chosen. It used to be two radio cards — but by the time a customer reached
 * them they had already picked their district one section above, so the cards
 * asked them to restate, in coarser words, something we already knew. On a
 * phone that is an extra scroll and an extra tap on the last screen before
 * payment, and a wrong tap changed the fee.
 *
 * So this reads out the answer instead of asking for it. Nothing to select. */
export function DeliveryOptions({ zone, district, freeShipping = false }) {
  if (!district) {
    return (
      <div className="mt-3.5 flex items-center gap-2.5 rounded-[14px] border border-dashed border-line-soft bg-[#FCFCF9] px-3.5 py-3 text-[13px] text-[#6B6E60] md:mt-4">
        <MapPin className="size-4 shrink-0 text-faint" aria-hidden="true" />
        <span>Pick your district above and we'll work out the delivery charge.</span>
      </div>
    );
  }

  if (!zone) {
    // Only reachable if the merchant has no zones configured at all. Order
    // creation already treats that as free shipping rather than blocking the
    // sale, so say so plainly instead of showing a broken-looking blank.
    return (
      <div className="mt-3.5 rounded-[14px] border border-line-soft bg-[#FCFCF9] px-3.5 py-3 text-[13px] text-[#6B6E60] md:mt-4">
        No delivery charge for {district}.
      </div>
    );
  }

  return (
    <div className="mt-3.5 rounded-[14px] border border-line-soft bg-[#FCFCF9] px-3.5 py-3 md:mt-4">
      <div className="flex items-start gap-3">
        <span className="mt-[2px] grid size-8 shrink-0 place-items-center rounded-full bg-[#F1F3E8] text-ink">
          <Truck className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[14.5px] font-bold text-ink">{zone.name}</span>
            <span className="shrink-0 text-sm font-bold text-ink">
              {freeShipping ? (
                <>
                  <span className="mr-1.5 text-[12.5px] font-semibold text-faint line-through">{formatTaka(zone.fee)}</span>
                  Free
                </>
              ) : (
                formatTaka(zone.fee)
              )}
            </span>
          </div>
          <div className="mt-[3px] text-[12.5px] text-[#6B6E60]">
            {zone.eta ? `${zone.eta} · ` : ""}Delivery charge for {district}
          </div>
        </div>
      </div>
    </div>
  );
}
