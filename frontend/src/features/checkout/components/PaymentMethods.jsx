import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import toast from "react-hot-toast";

import { formatTaka } from "@/lib/currency";
import { RadioCard, RadioDot, FieldBox, inputCls } from "./parts";
import { PAYMENT_OPTION_LABELS } from "../lib/paymentPlanPreview";

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); }}
      className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink"
    >
      {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />} Copy
    </button>
  );
}

function Qr({ image, caption }) {
  return (
    <div className="mx-auto shrink-0 md:mx-0">
      <div className="flex size-[148px] items-center justify-center overflow-hidden rounded-[14px] border border-line bg-white p-2.5">
        {image?.url ? <img src={image.url} alt="Payment QR" className="size-full object-contain" /> : <QrCode className="size-14 text-faint/40" strokeWidth={1.2} />}
      </div>
      <div className="mx-auto mt-1.5 max-w-[148px] text-center text-[11px] text-muted-foreground">{caption}</div>
    </div>
  );
}

/** Expanded-panel wrapper: QR centered on top (mobile) / left (desktop), the
 * send-money/reference content beside or below it. */
function ExpandPanel({ children }) {
  return (
    <div className="mt-3.5 border-t border-[#E4EDC8] pt-3.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-[18px] md:flex-row md:items-start">{children}</div>
    </div>
  );
}

function BkashLogo() {
  return <span className="inline-flex h-7 w-[54px] shrink-0 items-center justify-center rounded-[7px] bg-[#E2136E] text-xs font-extrabold italic text-white">bKash</span>;
}
function BqrLogo() {
  return <span className="inline-flex h-7 w-[54px] shrink-0 items-center justify-center rounded-[7px] border border-line bg-white text-ink"><QrCode size={16} strokeWidth={2} /></span>;
}

function Head({ selected, logo, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <RadioDot selected={selected} />
      {logo}
      <div className="flex-1">
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

/** Segmented control for choosing which business paymentOption (delivery-only /
 * partial advance / full) to fulfil via the manual bKash/BanglaQR proof flow —
 * only rendered when the cart's items actually offer a choice. Shows the
 * preview amount-now/amount-due for each option so the customer knows what
 * they're paying before scanning the QR. */
function PaymentOptionPicker({ options, value, onChange }) {
  if (options.length === 0) return null;

  return (
    <div className="mb-3.5">
      <div className="mb-2 text-[12.5px] font-semibold text-ink">How much would you like to pay now?</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`rounded-[10px] border px-3.5 py-2.5 text-left text-[12.5px] transition-colors ${
              value === opt.key ? "border-[1.5px] border-brand bg-[#FBFDF3]" : "border-line bg-white hover:border-ink"
            }`}
          >
            <div className="font-bold text-ink">{PAYMENT_OPTION_LABELS[opt.key]}</div>
            <div className="mt-0.5 text-faint">
              Pay {formatTaka(opt.amountPaid)} now
              {opt.amountDue > 0 ? ` · ${formatTaka(opt.amountDue)} due on delivery` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Payment radio cards; the selected method expands its panel. Controlled by the
 * parent form (value + register for the txn-id / reference inputs).
 *
 * codDisabled/codDisabledReason: when the cart's items and/or the selected
 * delivery zone don't allow plain Cash on Delivery, the COD card renders
 * disabled with an inline reason instead of being selectable (per the
 * requirement's explicit "disabled or display a message" wording).
 *
 * paymentOption/onPaymentOptionChange/nonCodOptions: the business option
 * (delivery-only/advance/full) being fulfilled via bKash/BanglaQR — offered as
 * a segmented control only when the cart allows more than one. */
export function PaymentMethods({
  value,
  onChange,
  bkashConfig,
  banglaQrConfig,
  register,
  errors,
  total,
  codDisabled = false,
  codDisabledReason = null,
  paymentOption = "full",
  onPaymentOptionChange = () => {},
  nonCodOptions = [],
  amountPaidPreview,
}) {
  const showPicker = nonCodOptions.length > 1;
  const selectedPreview = nonCodOptions.find((o) => o.key === paymentOption);
  const payNowNote = selectedPreview
    ? `Pay ${formatTaka(selectedPreview.amountPaid)} now${
        selectedPreview.amountDue > 0 ? `, ${formatTaka(selectedPreview.amountDue)} due on delivery` : ""
      }, then enter your payment reference below so we can match it instantly.`
    : `Pay the exact total ${formatTaka(amountPaidPreview ?? total)}, then enter your payment reference below so we can match it instantly.`;

  return (
    <div className="mt-5 flex flex-col gap-3">
      {/* COD */}
      <RadioCard
        selected={value === "cod"}
        onSelect={() => !codDisabled && onChange("cod")}
        className={codDisabled ? "cursor-not-allowed opacity-60" : undefined}
      >
        <div className="flex items-center gap-3">
          <RadioDot selected={value === "cod" && !codDisabled} />
          <div className="flex-1">
            <div className="text-sm font-bold text-ink">Cash on Delivery</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">
              {codDisabled ? codDisabledReason : "Pay when it arrives — nothing now"}
            </div>
          </div>
        </div>
      </RadioCard>

      {/* bKash */}
      <RadioCard selected={value === "bkash"} onSelect={() => onChange("bkash")}>
        <Head selected={value === "bkash"} logo={<BkashLogo />} title="bKash" subtitle={value === "bkash" ? "Scan the QR or Send Money, then enter your Transaction ID" : "Scan the QR or Send Money"} />
        {value === "bkash" && (
          <ExpandPanel>
            <Qr image={bkashConfig?.qrImage} caption="Scan with the bKash app" />
            <div className="w-full md:min-w-[240px] md:flex-1">
              <PaymentOptionPicker options={nonCodOptions} value={paymentOption} onChange={onPaymentOptionChange} />
              {bkashConfig?.merchantNumber && (
                <div className="flex items-center gap-2.5 rounded-[12px] border border-line bg-white px-4 py-3">
                  <span className="text-[13px] text-muted-foreground">or Send Money to</span>
                  <span className="text-[14.5px] font-extrabold tracking-[0.03em] text-ink">{bkashConfig.merchantNumber}</span>
                  <CopyBtn value={bkashConfig.merchantNumber} />
                </div>
              )}
              {showPicker && (
                <div className="mt-3 rounded-[12px] border border-line bg-white px-4 py-3 text-[12.5px] leading-[1.6] text-ink-soft">
                  {payNowNote}
                </div>
              )}
              <FieldBox label="bKash Transaction ID" error={errors.bkashTransactionId?.message} className="mt-3">
                <input {...register("bkashTransactionId")} placeholder="e.g. 9HK2XXXXXX" className={`${inputCls} bg-white`} />
              </FieldBox>
            </div>
          </ExpandPanel>
        )}
      </RadioCard>

      {/* BanglaQR */}
      <RadioCard selected={value === "banglaqr"} onSelect={() => onChange("banglaqr")}>
        <Head selected={value === "banglaqr"} logo={<BqrLogo />} title="BanglaQR" subtitle="Scan & pay from any bank or MFS app" />
        {value === "banglaqr" && (
          <ExpandPanel>
            <Qr image={banglaQrConfig?.qrImage} caption="Scan from any bank or MFS app" />
            <div className="w-full md:min-w-[240px] md:flex-1">
              <PaymentOptionPicker options={nonCodOptions} value={paymentOption} onChange={onPaymentOptionChange} />
              <div className="rounded-[12px] border border-line bg-white px-4 py-3 text-[12.5px] leading-[1.6] text-ink-soft">
                {payNowNote}
              </div>
              <FieldBox label="Payment reference" error={errors.banglaQrReference?.message} className="mt-3">
                <input {...register("banglaQrReference")} placeholder="e.g. TXN-XXXXXXXX" className={`${inputCls} bg-white`} />
              </FieldBox>
            </div>
          </ExpandPanel>
        )}
      </RadioCard>
    </div>
  );
}
