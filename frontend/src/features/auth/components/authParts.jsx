import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export const authInputCls =
  "w-full rounded-[12px] border border-line bg-white px-4 py-[14px] text-base leading-[1.2] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:text-sm";

/** Label + control + error, matching the design's field spacing. */
export function AuthField({ label, action, error, children, className }) {
  return (
    <div className={className}>
      <div className="mb-[7px] flex items-baseline justify-between">
        <span className="text-[12.5px] font-semibold text-ink">{label}</span>
        {action}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

/** Password input with a show/hide eye toggle. */
export function PasswordInput({ register, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...register}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(authInputCls, "pr-11")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-faint hover:text-ink"
      >
        {show ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
      </button>
    </div>
  );
}

/** 4-segment password strength meter (design: lime filled bars). */
function scorePassword(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s += 1;
  return s;
}

export function PasswordStrengthMeter({ value }) {
  const score = scorePassword(value);
  return (
    <div className="mt-2 flex gap-[5px]">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cn("h-1 flex-1 rounded-full", i < score ? "bg-brand" : "bg-line")} />
      ))}
    </div>
  );
}

/** Lime primary CTA. */
export function AuthSubmit({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-[22px] flex h-[50px] w-full items-center justify-center rounded-full bg-brand text-[15px] font-bold text-ink transition-colors hover:bg-brand-bright disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3.5">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium text-faint">or</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function GoogleButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-full border border-line bg-white text-[14.5px] font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
    >
      <span className="font-display text-[15px] font-extrabold">G</span>
      {children}
    </button>
  );
}
