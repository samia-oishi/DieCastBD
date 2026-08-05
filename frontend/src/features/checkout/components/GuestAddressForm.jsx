import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { bdPhoneSchema } from "@/lib/validators";
import { DistrictThanaFields } from "@/features/addresses/components/DistrictThanaFields";
import { FieldBox, inputCls } from "./parts";

const guestSchema = z.object({
  recipientName: z.string().min(1, "Name is required"),
  phone: bdPhoneSchema,
  addressLine1: z.string().min(1, "Address is required"),
  district: z.string().min(1, "Select your district"),
  thana: z.string().min(1, "Select your thana"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

/** Inline guest address form. Reports the valid values up (or null) as they
 * change, so the single "Place order" button can submit without a separate
 * "save address" step. */
export function GuestAddressForm({ onChange }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: { recipientName: "", phone: "", addressLine1: "", district: "", thana: "", email: "" },
  });

  // The dropdowns are controlled, so they write through setValue rather than
  // register. shouldValidate keeps isValid in step on the same tick — this form
  // reports itself up on every change and has no submit button of its own.
  const setField = (field) => (v) => setValue(field, v, { shouldValidate: true, shouldDirty: true });

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
      <DistrictThanaFields
        district={values.district}
        thana={values.thana}
        onDistrictChange={setField("district")}
        onThanaChange={setField("thana")}
        districtError={errors.district?.message}
        thanaError={errors.thana?.message}
        FieldWrapper={FieldBox}
      />
      <FieldBox label="Email" hint="(optional — for your order confirmation)" error={errors.email?.message}>
        <input {...register("email")} type="email" placeholder="you@email.com" className={inputCls} />
      </FieldBox>
    </div>
  );
}
