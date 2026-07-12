import { Wallet } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { RadioCard, RadioDot } from "./parts";

/** Delivery-zone radio cards from settings.shippingZones (name, fee, eta?). Zones
 * with requiresPrepay show a visible amber "paid upfront" tag rather than plain
 * muted text, so the requirement doesn't get lost among the eta/fee copy. */
export function DeliveryOptions({ zones, value, onChange }) {
  return (
    <div className="mt-5 grid gap-3.5 md:grid-cols-2">
      {zones.map((zone) => (
        <RadioCard key={zone.name} selected={value === zone.name} onSelect={() => onChange(zone.name)}>
          <div className="flex items-start gap-3">
            <RadioDot selected={value === zone.name} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ink">{zone.name}</div>
              {zone.eta && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{zone.eta}</div>}
              {zone.requiresPrepay && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-[3px] text-[11px] font-bold text-[#9A5B13]">
                  <Wallet size={11} strokeWidth={2.4} /> Delivery charge paid upfront
                </div>
              )}
            </div>
            <span className="shrink-0 text-sm font-bold text-ink">{zone.fee > 0 ? formatTaka(zone.fee) : "Free"}</span>
          </div>
        </RadioCard>
      ))}
    </div>
  );
}
