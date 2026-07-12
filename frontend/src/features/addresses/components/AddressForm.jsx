import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { addressSchema } from "../schemas/addressSchema";

// Matches the guest checkout form (GuestAddressForm / checkout parts.jsx) so the
// logged-in "add address" form is visually identical to the guest one.
const inputCls =
  "w-full rounded-[12px] border border-line bg-paper px-4 py-[13px] text-base leading-[1.2] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:text-[13.5px]";

function Field({ label, error, children }) {
  return (
    <div>
      <div className="mb-[7px] text-[12.5px] font-semibold text-ink">{label}</div>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function AddressForm({ onSubmit, isSubmitting, onCancel, defaultValues, submitLabel = "Save address" }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(addressSchema), defaultValues });

  // Not a <form> — this renders inside the checkout page's own <form>, and a nested
  // <form> is invalid HTML: the submit event bubbles to the outer form's onSubmit
  // too, which was firing full checkout validation/submission on every "Save address"
  // click. The onKeyDown below restores plain "press Enter to submit" UX.
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.tagName === "INPUT") {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" error={errors.recipientName?.message}>
          <input {...register("recipientName")} placeholder="e.g. Samia Alam" className={inputCls} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} inputMode="numeric" placeholder="01XXXXXXXXX" className={inputCls} />
        </Field>
      </div>

      <Field label="Address" error={errors.addressLine1?.message}>
        <input {...register("addressLine1")} placeholder="House, road, area" className={inputCls} />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="City" error={errors.city?.message}>
          <input {...register("city")} placeholder="Dhaka" className={inputCls} />
        </Field>
        <Field label="District">
          <input {...register("district")} placeholder="Dhaka" className={inputCls} />
        </Field>
        <Field label="Postal code">
          <input {...register("postalCode")} placeholder="1207" className={inputCls} />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-ink"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
