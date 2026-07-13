import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Lock, QrCode } from "lucide-react";

import { cn } from "@/lib/utils";
import { OptionCard, Radio, FieldBox, inputCls } from "./parts";
import { PaySplit } from "./PaySplit";

/** 01764250814 → "01764 250 814" (display only; the raw digits are copied). */
function formatMerchant(number) {
  const d = String(number ?? "").replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : (number ?? "");
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard unavailable — the number is still visible to copy by hand */
        }
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
      }}
      className="shrink-0 rounded-full border-[1.5px] border-ink px-3.5 py-1.5 text-[12.5px] font-bold text-ink transition-colors duration-150 hover:bg-ink hover:text-white"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function QrPanelImage({ image, caption }) {
  return (
    <div className="mx-auto shrink-0 md:mx-0">
      {image?.url ? (
        <div className="flex size-[126px] items-center justify-center overflow-hidden rounded-[14px] border border-line bg-white p-2">
          <img src={image.url} alt={caption} className="size-full object-contain" />
        </div>
      ) : (
        <div className="flex size-[126px] flex-col items-center justify-center gap-[7px] rounded-[14px] border-[1.5px] border-dashed border-[#C9CBBE] text-faint">
          <QrCode size={26} strokeWidth={1.6} />
          <span className="text-[11.5px] font-semibold">{caption}</span>
        </div>
      )}
    </div>
  );
}

function MethodRow({ selected, locked, onSelect, chip, title, sub, lockedChip }) {
  return (
    <OptionCard variant="method" selected={selected} locked={locked} onSelect={onSelect}>
      <div className="flex items-start gap-3.5">
        <Radio selected={selected} disabled={locked} />
        {chip}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[14.5px] font-bold text-ink">{title}</span>
            {lockedChip}
          </div>
          <div className="mt-[3px] text-[13px] leading-[1.5] text-[#6B6E60]">{sub}</div>
        </div>
      </div>
    </OptionCard>
  );
}

/** Payment section: scenario banner → 3 method rows → detail panel (pay-plan
 * selector + split bar + QR/reference). `view` is the derived view-model from
 * lib/checkoutCopy.js; nothing here computes money. */
export function PaymentMethods({
  value,
  onChange,
  view,
  bkashConfig,
  banglaQrConfig,
  register,
  errors,
  paymentOption,
  onPaymentOptionChange,
}) {
  const isBkash = value === "bkash";
  const isQr = value === "banglaqr";
  const panelOpen = isBkash || isQr;
  const merchant = bkashConfig?.merchantNumber;

  return (
    <>
      {/* scenario banner */}
      <div className="mt-4 flex items-start gap-3 rounded-[14px] bg-brand-tint p-4">
        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-brand-deep">
          <ShieldCheck size={17} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink">{view.banner.title}</div>
          <div className="mt-[3px] text-[13px] leading-[1.55] text-ink/70">{view.banner.body}</div>
        </div>
      </div>

      {/* methods */}
      <div className="mt-3.5 flex flex-col gap-2.5">
        <MethodRow
          selected={value === "cod"}
          locked={!view.codAllowed}
          onSelect={() => onChange("cod")}
          title="Cash on Delivery"
          sub={view.codSub}
          lockedChip={
            !view.codAllowed && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tile px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#6B6E60]">
                <Lock size={10} strokeWidth={2.4} /> Unavailable
              </span>
            )
          }
        />

        <MethodRow
          selected={isBkash}
          onSelect={() => onChange("bkash")}
          chip={
            <span className="shrink-0 rounded-lg bg-[#E2136E] px-3 py-[5px] text-[11.5px] font-extrabold italic text-white">
              bKash
            </span>
          }
          title="bKash"
          sub={
            <>
              <span className="md:hidden">Send Money or scan — under a minute</span>
              <span className="hidden md:inline">Send Money or scan — done in under a minute</span>
            </>
          }
        />

        <MethodRow
          selected={isQr}
          onSelect={() => onChange("banglaqr")}
          chip={
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink">
              <QrCode size={14} strokeWidth={2} />
            </span>
          }
          title="BanglaQR"
          sub="Scan & pay from any bank or MFS app"
        />
      </div>

      {/* detail panel */}
      {panelOpen && (
        <div className="mt-3.5 rounded-[16px] border border-line bg-white p-4 md:px-5 md:py-[18px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-[15px] font-bold text-ink">
              {isBkash ? "Pay with bKash" : "Pay with BanglaQR"}
            </span>
            <span className="text-[12.5px] text-faint">
              {isBkash
                ? "Scan in the bKash app, or Send Money to the number below"
                : "Scan with any bank or MFS app that supports BanglaQR"}
            </span>
          </div>

          <PaySplit view={view} paymentOption={paymentOption} onPaymentOptionChange={onPaymentOptionChange} />

          <div className="mt-4 flex flex-col gap-[18px] md:flex-row md:items-start">
            <QrPanelImage
              image={isBkash ? bkashConfig?.qrImage : banglaQrConfig?.qrImage}
              caption={isBkash ? "bKash QR" : "BanglaQR"}
            />

            <div className="min-w-0 flex-1">
              {isBkash && merchant && (
                <div className="flex flex-wrap items-center gap-2.5 rounded-[12px] bg-[#FAFAF7] px-3.5 py-[11px]">
                  <span className="text-[13px] text-[#6B6E60]">or Send Money to</span>
                  <b className="text-[14.5px] font-bold tracking-[0.02em] text-ink">{formatMerchant(merchant)}</b>
                  <span className="flex-1" />
                  <CopyButton value={String(merchant).replace(/\D/g, "")} />
                </div>
              )}

              <FieldBox
                label={isBkash ? "bKash Transaction ID" : "Payment reference"}
                error={isBkash ? errors.bkashTransactionId?.message : errors.banglaQrReference?.message}
                className={cn(isBkash && merchant ? "mt-3" : undefined)}
              >
                {isBkash ? (
                  <input {...register("bkashTransactionId")} placeholder="e.g. 9HK2XXXXXX" className={inputCls} />
                ) : (
                  <input
                    {...register("banglaQrReference")}
                    placeholder="Reference from your app receipt"
                    className={inputCls}
                  />
                )}
              </FieldBox>

              <p className="mt-2 text-[12.5px] leading-[1.55] text-faint">
                {isBkash
                  ? "Paste the Transaction ID from your bKash confirmation SMS — we match your payment instantly and reserve your piece."
                  : "Enter the reference from your banking app receipt so we can match your payment instantly."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
