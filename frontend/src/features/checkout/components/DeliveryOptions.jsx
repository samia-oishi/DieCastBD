import { formatTaka } from "@/lib/currency";
import { RadioCard, RadioDot } from "./parts";

/** Delivery-zone radio cards from settings.shippingZones (name, fee, eta?). */
export function DeliveryOptions({ zones, value, onChange }) {
  return (
    <div className="mt-5 grid gap-3.5 md:grid-cols-2">
      {zones.map((zone) => (
        <RadioCard key={zone.name} selected={value === zone.name} onSelect={() => onChange(zone.name)}>
          <div className="flex items-center gap-3">
            <RadioDot selected={value === zone.name} />
            <div className="flex-1">
              <div className="text-sm font-bold text-ink">{zone.name}</div>
              {zone.eta && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{zone.eta}</div>}
            </div>
            <span className="text-sm font-bold text-ink">{zone.fee > 0 ? formatTaka(zone.fee) : "Free"}</span>
          </div>
        </RadioCard>
      ))}
    </div>
  );
}
