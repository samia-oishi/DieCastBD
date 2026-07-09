import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup, FieldDescription } from "@/components/ui/field";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { updateProfileSchema } from "../schemas/accountSchemas";
import { useUpdateProfileMutation, useDeactivateAccountMutation } from "../api/useAccount";

export function ProfileForm() {
  const { data: user } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    values: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  const updateMutation = useUpdateProfileMutation();
  const deactivateMutation = useDeactivateAccountMutation();

  const onSubmit = (values) => {
    updateMutation.mutate(values, {
      onSuccess: () => toast.success("Profile updated"),
      onError: () => toast.error("Could not update profile"),
    });
  };

  const onDeactivate = () => {
    if (!window.confirm("Deactivate your account? You'll be signed out immediately.")) return;
    deactivateMutation.mutate(undefined, {
      onError: () => toast.error("Could not deactivate account"),
    });
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="font-heading text-2xl">My profile</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input id="name" {...register("name")} />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </Field>

          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input id="phone" type="tel" {...register("phone")} />
            <FieldError errors={errors.phone ? [errors.phone] : undefined} />
          </Field>

          <Field>
            <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <div className="border-t border-border pt-6">
        <FieldDescription className="mb-3">
          Deactivating your account signs you out and hides your profile. This does not delete your order
          history.
        </FieldDescription>
        <Button variant="destructive" onClick={onDeactivate} disabled={deactivateMutation.isPending}>
          {deactivateMutation.isPending ? "Deactivating..." : "Deactivate account"}
        </Button>
      </div>
    </div>
  );
}
