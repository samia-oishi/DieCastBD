import { ShieldCheck, Box, Truck, Wallet } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";

// Design brand copy (static). Editability tracked in the Phase 9 backlog.
const CELLS = [
  { icon: ShieldCheck, title: "Verified authentic", desc: "Inspected before it's listed." },
  { icon: Box, title: "Collector-grade packing", desc: "Mint on arrival, every time." },
  { icon: Truck, title: "Nationwide delivery", desc: "Tracked, door to door." },
  { icon: Wallet, title: "Pay your way", desc: "COD, bKash or BanglaQR." },
];

export function TrustStrip() {
  return (
    <section className="pt-[26px] md:pt-[76px]">
      <Container>
        {/* Mobile: single stacked column with row dividers, 38px icons */}
        <div className="overflow-hidden rounded-[20px] border border-line bg-white md:hidden">
          {CELLS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className={cn(i < CELLS.length - 1 && "border-b border-tile", "flex items-center gap-3 px-4 py-[15px]")}>
              <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
                <Icon size={17} strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-ink">{title}</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: joined 4-cell card, hairline grid, 44px icons */}
        <div className="hidden overflow-hidden rounded-3xl border border-line bg-white md:block">
          <div className="-ml-px -mt-px grid grid-cols-[repeat(auto-fit,minmax(195px,1fr))]">
            {CELLS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3.5 border-l border-t border-line-soft p-[28px_26px]">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-[14.5px] font-bold text-ink">{title}</div>
                  <div className="mt-[3px] text-[12.5px] text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
