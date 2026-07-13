import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { OptionCard, Eyebrow } from "./parts";

function PlanCard({ plan, selected, onSelect, badge, badgeTone }) {
  if (!plan) return null;
  return (
    <OptionCard variant="plan" selected={selected} onSelect={onSelect} className="flex-1 min-w-0">
      <span
        className={cn(
          "inline-block rounded-full px-[9px] py-[3px] text-[10px] font-extrabold uppercase tracking-[0.06em]",
          badgeTone === "lime" ? "bg-brand text-ink" : "bg-tile text-ink-soft"
        )}
      >
        {badge}
      </span>
      <div className="mt-[9px] font-display text-base font-extrabold text-ink">{plan.title}</div>
      <div className="mt-[3px] text-[12.5px] text-[#6B6E60]">{plan.sub}</div>
    </OptionCard>
  );
}

/** "What are you paying now?" — the two amount cards (minimum vs full) when the
 * cart genuinely offers a choice, otherwise a single static note — followed by
 * the pay-now / cash-on-delivery split bar and its legend. */
export function PaySplit({ view, paymentOption, onPaymentOptionChange }) {
  const { selectorVisible, plans, staticNote, payNow, due, barNowPct } = view;

  return (
    <>
      {selectorVisible ? (
        <>
          <Eyebrow className="mt-4">What are you paying now?</Eyebrow>
          <div className="mt-2 flex flex-col gap-2.5 md:flex-row">
            <PlanCard
              plan={plans.a}
              badge="Minimum to confirm"
              badgeTone="lime"
              selected={paymentOption === plans.a?.key}
              onSelect={() => onPaymentOptionChange(plans.a.key)}
            />
            <PlanCard
              plan={plans.b}
              badge="Nothing due later"
              badgeTone="grey"
              selected={paymentOption === "full"}
              onSelect={() => onPaymentOptionChange("full")}
            />
          </div>
        </>
      ) : (
        <div className="mt-3.5 rounded-[10px] bg-[#FAFAF7] px-[14px] py-2.5 text-[13.5px] font-semibold text-ink">
          {staticNote}
        </div>
      )}

      {/* split bar */}
      <div className="mt-4 flex h-[7px] gap-[3px] md:h-2">
        <div
          className="rounded-[99px] bg-brand transition-[width] duration-[250ms] ease-out"
          style={{ width: `${barNowPct}%` }}
        />
        {due > 0 && <div className="flex-1 rounded-[99px] bg-[#E3E4DA]" />}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-[#6B6E60]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-brand" />
          Pay now&nbsp;<b className="font-bold text-ink">{formatTaka(payNow)}</b>
        </span>
        {due > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full bg-[#D8DACC]" />
            Cash on delivery&nbsp;<b className="font-bold text-ink">{formatTaka(due)}</b>
          </span>
        )}
      </div>
    </>
  );
}
