import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router";
import toast from "react-hot-toast";

import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";
import { loginSchema } from "../schemas/authSchemas";
import { useLoginMutation, useGoogleLoginMutation } from "../api/useAuth";
import { getAuthErrorMessage } from "../api/firebaseAuth";
import { AuthShell } from "./AuthShell";
import { AuthField, PasswordInput, AuthSubmit, OrDivider, GoogleButton, authInputCls } from "./authParts";

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || ROUTES.HOME;

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });
  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleLoginMutation();

  const onSubmit = (values) =>
    loginMutation.mutate(values, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });

  const onGoogleLogin = () =>
    googleMutation.mutate(undefined, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });

  const isPending = loginMutation.isPending || googleMutation.isPending;

  return (
    <AuthShell variant="signin" back={{ to: ROUTES.SHOP, label: "Back to the store" }}>
      <Seo title="Sign in" noindex />
      <h1 className="mt-[22px] font-display text-[30px] font-extrabold tracking-[-0.015em] text-ink">Sign in</h1>
      <p className="mt-2 text-[14.5px] text-muted-foreground">Welcome back, collector.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-[26px]">
        <AuthField label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" placeholder="you@email.com" className={authInputCls} {...register("email")} />
        </AuthField>

        <AuthField
          label="Password"
          className="mt-4"
          error={errors.password?.message}
          action={<Link to={ROUTES.FORGOT_PASSWORD} className="text-[12.5px] font-semibold text-brand-deep">Forgot password?</Link>}
        >
          <PasswordInput register={register("password")} placeholder="••••••••" autoComplete="current-password" />
        </AuthField>

        <AuthSubmit disabled={isPending}>{loginMutation.isPending ? "Signing in…" : "Sign in"}</AuthSubmit>
      </form>

      <OrDivider />
      <GoogleButton onClick={onGoogleLogin} disabled={isPending}>
        {googleMutation.isPending ? "Connecting…" : "Continue with Google"}
      </GoogleButton>

      <div className="mt-6 text-center text-[13.5px] text-muted-foreground">
        New to DiecastBD? <Link to={ROUTES.REGISTER} className="font-bold text-ink">Create an account</Link>
      </div>
    </AuthShell>
  );
}
