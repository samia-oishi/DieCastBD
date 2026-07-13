import { formatTaka } from "@/lib/currency";
import { OptionCard, Radio } from "./parts";

/** Delivery-zone cards from settings.shippingZones (name · fee · eta). Stacked
 * on mobile, two-up on desktop. */
export function DeliveryOptions({ zones, value, onChange }) {
  return (
    <div className="mt-3.5 grid gap-2.5 md:mt-4 md:grid-cols-2 md:gap-3">
      {zones.map((zone) => {
        const selected = value === zone.name;
        return (
          <OptionCard key={zone.name} variant="zone" selected={selected} onSelect={() => onChange(zone.name)}>
            <div className="flex items-start gap-3">
              <Radio selected={selected} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14.5px] font-bold text-ink">{zone.name}</span>
                  <span className="text-sm font-bold text-ink">{formatTaka(zone.fee)}</span>
                </div>
                {zone.eta && <div className="mt-[3px] text-[12.5px] text-[#6B6E60]">{zone.eta}</div>}
              </div>
            </div>
          </OptionCard>
        );
      })}
    </div>
  );
}
