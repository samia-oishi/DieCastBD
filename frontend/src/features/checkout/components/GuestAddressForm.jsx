import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { bdPhoneSchema } from "@/lib/validators";
import { FieldBox, inputCls } from "./parts";

const guestSchema = z.object({
  recipientName: z.string().min(1, "Name is required"),
  phone: bdPhoneSchema,
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  district: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

/** Inline guest address form. Reports the valid values up (or null) as they
 * change, so the single "Place order" button can submit without a separate
 * "save address" step. */
export function GuestAddressForm({ onChange }) {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: { recipientName: "", phone: "", addressLine1: "", city: "", district: "", postalCode: "", email: "" },
  });

  const values = watch();
  const serialized = JSON.stringify(values);

  useEffect(() => {
    onChange(isValid ? values : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, isValid]);

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FieldBox label="Full name" error={errors.recipientName?.message}>
          <input {...register("recipientName")} placeholder="e.g. Samia Alam" className={inputCls} />
        </FieldBox>
        <FieldBox label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} inputMode="numeric" placeholder="01XXXXXXXXX" className={inputCls} />
        </FieldBox>
      </div>
      <FieldBox label="Address" error={errors.addressLine1?.message}>
        <input {...register("addressLine1")} placeholder="House, road, area" className={inputCls} />
      </FieldBox>
      <div className="grid gap-4 md:grid-cols-3">
        <FieldBox label="City" error={errors.city?.message}>
          <input {...register("city")} placeholder="Dhaka" className={inputCls} />
        </FieldBox>
        <FieldBox label="District">
          <input {...register("district")} placeholder="Dhaka" className={inputCls} />
        </FieldBox>
        <FieldBox label="Postal code">
          <input {...register("postalCode")} placeholder="1207" className={inputCls} />
        </FieldBox>
      </div>
      <FieldBox label="Email" hint="(optional — for your order confirmation)" error={errors.email?.message}>
        <input {...register("email")} type="email" placeholder="you@email.com" className={inputCls} />
      </FieldBox>
    </div>
  );
}
