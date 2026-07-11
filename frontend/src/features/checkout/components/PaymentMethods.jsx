import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import toast from "react-hot-toast";

import { formatTaka } from "@/lib/currency";
import { RadioCard, RadioDot, FieldBox, inputCls } from "./parts";

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
    <div className="shrink-0">
      <div className="flex size-[148px] items-center justify-center overflow-hidden rounded-[14px] border border-line bg-white p-2.5">
        {image?.url ? <img src={image.url} alt="Payment QR" className="size-full object-contain" /> : <QrCode className="size-14 text-faint/40" strokeWidth={1.2} />}
      </div>
      <div className="mt-1.5 max-w-[148px] text-center text-[11px] text-muted-foreground">{caption}</div>
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

/** Payment radio cards; the selected method expands its panel. Controlled by the
 * parent form (value + register for the txn-id / reference inputs). */
export function PaymentMethods({ value, onChange, bkashConfig, banglaQrConfig, register, errors, total }) {
  return (
    <div className="mt-5 flex flex-col gap-3">
      {/* COD */}
      <RadioCard selected={value === "cod"} onSelect={() => onChange("cod")}>
        <div className="flex items-center gap-3">
          <RadioDot selected={value === "cod"} />
          <div className="flex-1">
            <div className="text-sm font-bold text-ink">Cash on Delivery</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">Pay when it arrives — nothing now</div>
          </div>
        </div>
      </RadioCard>

      {/* bKash */}
      <RadioCard selected={value === "bkash"} onSelect={() => onChange("bkash")}>
        <Head selected={value === "bkash"} logo={<BkashLogo />} title="bKash" subtitle={value === "bkash" ? "Scan the QR or Send Money, then enter your Transaction ID" : "Scan the QR or Send Money"} />
        {value === "bkash" && (
          <div className="mt-3.5 flex flex-wrap gap-[18px] border-t border-[#E4EDC8] pt-3.5" onClick={(e) => e.stopPropagation()}>
            {bkashConfig?.qrImage?.url && <Qr image={bkashConfig.qrImage} caption="Scan with the bKash app" />}
            <div className="min-w-[240px] flex-1">
              {bkashConfig?.merchantNumber && (
                <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3">
                  <span className="text-[13px] text-muted-foreground">Send Money to</span>
                  <span className="text-[14.5px] font-extrabold tracking-[0.03em] text-ink">{bkashConfig.merchantNumber}</span>
                  <CopyBtn value={bkashConfig.merchantNumber} />
                </div>
              )}
              <FieldBox label="bKash Transaction ID" error={errors.bkashTransactionId?.message} className="mt-3">
                <input {...register("bkashTransactionId")} placeholder="e.g. 9HK2XXXXXX" className={`${inputCls} bg-white`} />
              </FieldBox>
            </div>
          </div>
        )}
      </RadioCard>

      {/* BanglaQR */}
      <RadioCard selected={value === "banglaqr"} onSelect={() => onChange("banglaqr")}>
        <Head selected={value === "banglaqr"} logo={<BqrLogo />} title="BanglaQR" subtitle="Scan & pay from any bank or MFS app" />
        {value === "banglaqr" && (
          <div className="mt-3.5 flex flex-wrap gap-[18px] border-t border-[#E4EDC8] pt-3.5" onClick={(e) => e.stopPropagation()}>
            {banglaQrConfig?.qrImage?.url && <Qr image={banglaQrConfig.qrImage} caption="Scan from any bank or MFS app" />}
            <div className="min-w-[240px] flex-1">
              <div className="rounded-xl border border-line bg-white px-4 py-3 text-[12.5px] leading-[1.6] text-ink-soft">
                Pay the exact total <b>{formatTaka(total)}</b>, then enter the payment reference below so we can match it instantly.
              </div>
              <FieldBox label="Payment reference" error={errors.banglaQrReference?.message} className="mt-3">
                <input {...register("banglaQrReference")} placeholder="e.g. TXN-XXXXXXXX" className={`${inputCls} bg-white`} />
              </FieldBox>
            </div>
          </div>
        )}
      </RadioCard>
    </div>
  );
}
