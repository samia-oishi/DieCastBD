import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { addressSchema } from "../schemas/addressSchema";

export function AddressForm({ onSubmit, isSubmitting, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(addressSchema) });

  // Not a <form> — this renders inside the checkout page's own <form>, and a nested
  // <form> is invalid HTML: the submit event bubbles to the outer form's onSubmit
  // too, which was firing full checkout validation/submission on every "Save address"
  // click. The onKeyDown below restores plain "press Enter to submit" UX that a real
  // <form> would otherwise give for free.
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.tagName === "INPUT") {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.recipientName}>
            <FieldLabel htmlFor="recipientName">Full name</FieldLabel>
            <Input id="recipientName" {...register("recipientName")} />
            <FieldError errors={errors.recipientName ? [errors.recipientName] : undefined} />
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input id="phone" type="tel" {...register("phone")} />
            <FieldError errors={errors.phone ? [errors.phone] : undefined} />
          </Field>
        </div>

        <Field data-invalid={!!errors.addressLine1}>
          <FieldLabel htmlFor="addressLine1">Address</FieldLabel>
          <Input id="addressLine1" placeholder="House, road, area" {...register("addressLine1")} />
          <FieldError errors={errors.addressLine1 ? [errors.addressLine1] : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="addressLine2">Address line 2 (optional)</FieldLabel>
          <Input id="addressLine2" {...register("addressLine2")} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field data-invalid={!!errors.city}>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input id="city" {...register("city")} />
            <FieldError errors={errors.city ? [errors.city] : undefined} />
          </Field>
          <Field>
            <FieldLabel htmlFor="district">District</FieldLabel>
            <Input id="district" {...register("district")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>
            <Input id="postalCode" {...register("postalCode")} />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save address"}
          </Button>
        </div>
      </FieldGroup>
    </div>
  );
}
