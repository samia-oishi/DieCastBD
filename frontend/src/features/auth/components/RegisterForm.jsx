import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup, FieldDescription } from "@/components/ui/field";
import { ROUTES } from "@/constants/routes";
import { registerSchema } from "../schemas/authSchemas";
import { useRegisterMutation, useGoogleLoginMutation } from "../api/useAuth";
import { getAuthErrorMessage } from "../api/firebaseAuth";

export function RegisterForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const registerMutation = useRegisterMutation();
  const googleMutation = useGoogleLoginMutation();

  const onSubmit = (values) => {
    registerMutation.mutate(values, {
      onSuccess: () => navigate(ROUTES.HOME, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });
  };

  const onGoogleLogin = () => {
    googleMutation.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.HOME, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });
  };

  const isPending = registerMutation.isPending || googleMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl">Create an account</h1>
        <p className="text-sm text-muted-foreground">Join DiecastBD.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input id="name" autoComplete="name" {...register("name")} />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            <FieldError errors={errors.password ? [errors.password] : undefined} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : undefined} />
          </Field>

          <Field>
            <Button type="submit" disabled={isPending}>
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </Field>

          <Field>
            <Button type="button" variant="outline" disabled={isPending} onClick={onGoogleLogin}>
              {googleMutation.isPending ? "Connecting..." : "Continue with Google"}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
