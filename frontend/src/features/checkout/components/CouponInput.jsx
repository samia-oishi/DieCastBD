import { useState } from "react";
import { X, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useValidateCouponMutation } from "../api/useCoupon";

export function CouponInput({ subtotal, appliedCoupon, onApply, onRemove }) {
  const [code, setCode] = useState("");
  const validateMutation = useValidateCouponMutation();

  const applyCoupon = () => {
    if (!code.trim()) return;
    validateMutation.mutate(
      { code: code.trim(), subtotal },
      { onSuccess: (result) => onApply(result) }
    );
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <Tag className="size-3.5 text-primary" />
          {appliedCoupon.code} applied
        </span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Not a <form> — this renders inside the checkout page's own <form>, and a
          nested <form> is invalid HTML: the submit event bubbles to the outer
          form's onSubmit too, which was firing full checkout validation/submission
          on every "Apply" click. */}
      <div className="flex gap-2">
        <Input
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyCoupon();
            }
          }}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={applyCoupon} disabled={validateMutation.isPending || !code.trim()}>
          Apply
        </Button>
      </div>
      {validateMutation.isError && (
        <p className="text-xs text-destructive">
          {validateMutation.error?.response?.data?.message ?? "Invalid coupon"}
        </p>
      )}
    </div>
  );
}
