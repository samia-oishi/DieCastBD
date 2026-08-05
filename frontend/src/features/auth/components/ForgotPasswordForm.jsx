import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";

import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";
import { forgotPasswordSchema } from "../schemas/authSchemas";
import { useForgotPasswordMutation } from "../api/useAuth";
import { getAuthErrorMessage } from "../api/firebaseAuth";
import { AuthShell } from "./AuthShell";
import { AuthField, AuthSubmit, authInputCls } from "./authParts";

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(forgotPasswordSchema) });
  const resetMutation = useForgotPasswordMutation();

  const onSubmit = ({ email }) =>
    resetMutation.mutate(email, { onError: (error) => toast.error(getAuthErrorMessage(error)) });

  return (
    <AuthShell variant="signin" back={{ to: ROUTES.LOGIN, label: "Back to sign in" }}>
      <Seo title="Reset password" noindex />
      {resetMutation.isSuccess ? (
        <div className="mt-8">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-[#EFF5DC] text-brand-deep">
            <MailCheck size={22} strokeWidth={1.9} />
          </div>
          <h1 className="mt-4 font-display text-[26px] font-extrabold tracking-[-0.015em] text-ink">Check your email</h1>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-muted-foreground">
            If an account exists for that address, we've sent a password reset link.
          </p>
          <Link to={ROUTES.LOGIN} className="mt-6 inline-block text-[13.5px] font-bold text-ink">Back to sign in</Link>
        </div>
      ) : (
        <>
          <h1 className="mt-[22px] font-display text-[30px] font-extrabold tracking-[-0.015em] text-ink">Reset your password</h1>
          <p className="mt-2 text-[14.5px] text-muted-foreground">Enter your email and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-[26px]">
            <AuthField label="Email" error={errors.email?.message}>
              <input type="email" autoComplete="email" placeholder="you@email.com" className={authInputCls} {...register("email")} />
            </AuthField>
            <AuthSubmit disabled={resetMutation.isPending}>{resetMutation.isPending ? "Sending…" : "Send reset link"}</AuthSubmit>
          </form>
        </>
      )}
    </AuthShell>
  );
}
