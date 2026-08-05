import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";

import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";
import { registerSchema } from "../schemas/authSchemas";
import { useRegisterMutation, useGoogleLoginMutation } from "../api/useAuth";
import { getAuthErrorMessage } from "../api/firebaseAuth";
import { AuthShell } from "./AuthShell";
import { AuthField, PasswordInput, PasswordStrengthMeter, AuthSubmit, OrDivider, GoogleButton, authInputCls } from "./authParts";

export function RegisterForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema) });
  const registerMutation = useRegisterMutation();
  const googleMutation = useGoogleLoginMutation();

  const onSubmit = (values) =>
    registerMutation.mutate(values, {
      onSuccess: () => navigate(ROUTES.HOME, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });

  const onGoogleLogin = () =>
    googleMutation.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.HOME, { replace: true }),
      onError: (error) => toast.error(getAuthErrorMessage(error)),
    });

  const isPending = registerMutation.isPending || googleMutation.isPending;

  return (
    <AuthShell variant="register" back={{ to: ROUTES.LOGIN, label: "Back to sign in" }}>
      <Seo title="Create an account" noindex />
      <h1 className="mt-[22px] font-display text-[30px] font-extrabold tracking-[-0.015em] text-ink">Create an account</h1>
      <p className="mt-2 text-[14.5px] text-muted-foreground">Takes under a minute — then straight back to the shelf.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-[26px]">
        <AuthField label="Full name" error={errors.name?.message}>
          <input autoComplete="name" placeholder="e.g. Samia Alam" className={authInputCls} {...register("name")} />
        </AuthField>

        <AuthField label="Email" className="mt-4" error={errors.email?.message}>
          <input type="email" autoComplete="email" placeholder="you@email.com" className={authInputCls} {...register("email")} />
        </AuthField>

        <AuthField label="Password" className="mt-4" error={errors.password?.message}>
          <PasswordInput register={register("password")} placeholder="8+ characters" autoComplete="new-password" />
          <PasswordStrengthMeter value={watch("password")} />
        </AuthField>

        <AuthSubmit disabled={isPending}>{registerMutation.isPending ? "Creating account…" : "Create account"}</AuthSubmit>
      </form>

      <OrDivider />
      <GoogleButton onClick={onGoogleLogin} disabled={isPending}>
        {googleMutation.isPending ? "Connecting…" : "Continue with Google"}
      </GoogleButton>

      <p className="mt-[18px] text-center text-xs leading-[1.5] text-faint">
        By creating an account you agree to our <Link to={ROUTES.TERMS} className="text-ink-soft">Terms</Link> &amp;{" "}
        <Link to={ROUTES.PRIVACY} className="text-ink-soft">Privacy Policy</Link>.
      </p>
      <div className="mt-3.5 text-center text-[13.5px] text-muted-foreground">
        Already have an account? <Link to={ROUTES.LOGIN} className="font-bold text-ink">Sign in</Link>
      </div>
    </AuthShell>
  );
}
