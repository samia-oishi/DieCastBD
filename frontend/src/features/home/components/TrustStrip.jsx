import { ShieldCheck, Box, Truck, Wallet } from "lucide-react";

import { Container } from "@/components/shared/Container";

// Design brand copy (static). Editability tracked in the Phase 9 backlog.
const CELLS = [
  { icon: ShieldCheck, title: "Verified authentic", desc: "Inspected before it's listed." },
  { icon: Box, title: "Collector-grade packing", desc: "Mint on arrival, every time." },
  { icon: Truck, title: "Nationwide delivery", desc: "Tracked, door to door." },
  { icon: Wallet, title: "Pay your way", desc: "COD, bKash or BanglaQR." },
];

/** Single joined white card, 4 cells with hairline dividers. Each cell carries a
 * top+left border and the container clips the outer row/col via -1px margin, so
 * the grid wraps cleanly at any column count. */
export function TrustStrip() {
  return (
    <section className="pt-6 md:pt-[76px]">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="-ml-px -mt-px grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(195px,1fr))]">
            {CELLS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3.5 border-l border-t border-line-soft p-5 md:p-[28px_26px]">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-ink md:text-[14.5px]">{title}</div>
                  <div className="mt-[3px] text-[11.5px] text-muted-foreground md:text-[12.5px]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
