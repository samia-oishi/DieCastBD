import { Truck, Wallet, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Design copy (static). Delivery/payment/authenticity reassurance.
const ROWS = [
  { icon: Truck, label: "Delivery:", text: "Dhaka 24–48h · nationwide 2–4 days, tracked" },
  { icon: Wallet, label: "Pay your way:", text: "COD · bKash · BanglaQR" },
  { icon: ShieldCheck, label: "Verified authentic", text: "— inspected before dispatch, double-boxed" },
];

export function ReassuranceCard({ className }) {
  return (
    <div className={className}>
      <div className="rounded-[18px] border border-line bg-white px-4 md:rounded-[20px] md:px-5">
        {ROWS.map(({ icon: Icon, label, text }, i) => (
          <div
            key={label}
            className={cn("flex items-center gap-3 py-3 md:gap-3.5 md:py-3.5", i < ROWS.length - 1 && "border-b border-tile")}
          >
            {/* Bare colored icon on mobile; circle-background icon on desktop. */}
            <span className="shrink-0 text-brand-deep md:hidden">
              <Icon size={16} strokeWidth={1.8} />
            </span>
            <div className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-deep md:flex">
              <Icon size={17} strokeWidth={1.8} />
            </div>
            <div className="text-[12.5px] text-ink-soft md:text-[13.5px]">
              <span className="font-bold text-ink">{label}</span> {text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
