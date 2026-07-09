import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup, FieldDescription } from "@/components/ui/field";
import { ROUTES } from "@/constants/routes";
import { loginSchema } from "../schemas/authSchemas";
import { useLoginMutation, useGoogleLoginMutation } from "../api/useAuth";
import { getAuthErrorMessage } from "../api/firebaseAuth";

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || ROUTES.HOME;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleLoginMutation();

  const onSubmit = (values) => {
    loginMutation.mutate(values, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });
  };

  const onGoogleLogin = () => {
    googleMutation.mutate(undefined, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });
  };

  const isPending = loginMutation.isPending || googleMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back, collector.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError errors={errors.email ? [errors.email] : undefined} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-muted-foreground hover:text-primary">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            <FieldError errors={errors.password ? [errors.password] : undefined} />
          </Field>

          <Field>
            <Button type="submit" disabled={isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </Field>

          <Field>
            <Button type="button" variant="outline" disabled={isPending} onClick={onGoogleLogin}>
              {googleMutation.isPending ? "Connecting..." : "Continue with Google"}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Don't have an account? <Link to={ROUTES.REGISTER}>Create one</Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
