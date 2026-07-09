import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup, FieldDescription } from "@/components/ui/field";
import { ROUTES } from "@/constants/routes";
import { forgotPasswordSchema } from "../schemas/authSchemas";
import { useForgotPasswordMutation } from "../api/useAuth";
import { getAuthErrorMessage } from "../api/firebaseAuth";

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const resetMutation = useForgotPasswordMutation();

  const onSubmit = ({ email }) => {
    resetMutation.mutate(email, {
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });
  };

  if (resetMutation.isSuccess) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h1 className="font-heading text-2xl">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, we've sent a password reset link.
        </p>
        <Link to={ROUTES.LOGIN} className="text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          <Field>
            <Button type="submit" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Sending..." : "Send reset link"}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            <Link to={ROUTES.LOGIN}>Back to sign in</Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
