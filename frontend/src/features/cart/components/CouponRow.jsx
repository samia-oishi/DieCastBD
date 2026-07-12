import { useState } from "react";
import { Tag, X } from "lucide-react";
import toast from "react-hot-toast";

import { useValidateCouponMutation } from "@/features/checkout/api/useCoupon";

/** Coupon input + Apply → applied state. Shared by the cart page summary and
 * the cart drawer. */
export function CouponRow({ subtotal, coupon, onApply, onRemove, className }) {
  const [code, setCode] = useState("");
  const validate = useValidateCouponMutation();

  if (coupon) {
    return (
      <div className={`flex items-center justify-between rounded-full border border-brand/50 bg-brand-tint/40 px-4 py-2.5 text-[13px] ${className ?? ""}`}>
        <span className="flex items-center gap-2 font-semibold text-ink"><Tag className="size-3.5 text-brand-deep" /> {coupon.code} applied</span>
        <button type="button" onClick={onRemove} aria-label="Remove coupon" className="text-faint hover:text-danger"><X className="size-4" /></button>
      </div>
    );
  }

  const apply = () => {
    if (!code.trim()) return;
    validate.mutate(
      { code: code.trim(), subtotal },
      {
        onSuccess: (result) => { onApply(result); setCode(""); },
        onError: (e) => toast.error(e?.response?.data?.message || "Invalid coupon"),
      }
    );
  };

  return (
    <div className={`flex gap-2.5 ${className ?? ""}`}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
        placeholder="Coupon code"
        className="min-w-0 flex-1 rounded-full border border-line bg-paper px-[18px] py-3 text-base text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:text-[13.5px]"
      />
      <button type="button" onClick={apply} disabled={validate.isPending} className="shrink-0 rounded-full border-[1.5px] border-ink px-5 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50">
        {validate.isPending ? "…" : "Apply"}
      </button>
    </div>
  );
}
