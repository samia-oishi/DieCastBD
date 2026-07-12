import { Wallet } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { RadioCard, RadioDot } from "./parts";

/** Delivery-zone radio cards from settings.shippingZones (name, fee, eta?). Zones
 * with requiresPrepay get a small inline amber note under the eta line — same
 * plain-text treatment as the eta copy (no pill/background box), just recolored
 * so it reads as a requirement rather than another badge competing for attention. */
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
                <div className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-[#9A3412]">
                  <Wallet size={11} strokeWidth={2.5} className="shrink-0" />
                  Prepay delivery charge
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
