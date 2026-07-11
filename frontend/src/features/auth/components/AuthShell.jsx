import { Link } from "react-router";
import { ArrowLeft, Check } from "lucide-react";

import { ROUTES } from "@/constants/routes";

function Wordmark({ dark }) {
  return (
    <Link to={ROUTES.HOME} className="font-display text-[22px] font-extrabold italic tracking-[-0.01em]">
      <span className={dark ? "text-white" : "text-ink"}>DIECAST</span>
      <span className={dark ? "text-brand" : "text-white"}>BD</span>
    </Link>
  );
}

const SIGNIN_PERKS = [
  "Track every order to your door",
  "Saved address — checkout in seconds",
  "Wishlist + restock alerts on sold-out runs",
];

/** Lime brand panel (Sign in). */
function SignInBrand() {
  return (
    <div
      className="hidden min-h-[320px] flex-col justify-between gap-10 px-8 py-11 md:flex md:px-12"
      style={{ background: "radial-gradient(120% 140% at 80% 0%, #BADD4D 0%, #A8CD2F 55%, #9CC12A 100%)" }}
    >
      <Wordmark />
      <div>
        <div className="font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink md:text-[clamp(30px,3.2vw,44px)]">
          Your shelf,<br />one sign-in away.
        </div>
        <div className="mt-[26px] flex flex-col gap-3">
          {SIGNIN_PERKS.map((perk) => (
            <div key={perk} className="flex items-center gap-2.5 text-[14.5px] font-semibold text-[#1C2108]">
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/40"><Check size={12} strokeWidth={2.8} /></span>
              {perk}
            </div>
          ))}
        </div>
      </div>
      <div className="text-[12.5px] font-medium text-ink/60">100% authentic · COD · bKash · BanglaQR</div>
    </div>
  );
}

/** Dark brand panel (Create account). */
function RegisterBrand() {
  return (
    <div className="hidden min-h-[320px] flex-col justify-between gap-10 bg-ink px-8 py-11 md:flex md:px-12">
      <Wordmark dark />
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Join the collectors</div>
        <div className="mt-3.5 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white md:text-[clamp(30px,3.2vw,44px)]">
          Serious metal.<br />Serious shelf.
        </div>
        <p className="mt-[18px] max-w-[380px] text-[15px] leading-[1.65] text-[#A9AC9F]">
          One account for order tracking, saved addresses, wishlists, and first dibs on every drop.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Hot Wheels Premium", "MINI GT"].map((tag) => (
          <span key={tag} className="rounded-full border border-white/[0.18] px-3.5 py-1.5 text-xs font-semibold text-[#DDDFD2]">{tag}</span>
        ))}
      </div>
    </div>
  );
}

/** Split-screen auth shell: brand panel + centered form column. On narrow
 * screens the grid collapses and the brand panel stacks on top. */
export function AuthShell({ variant = "signin", back, children }) {
  return (
    <div className="grid min-h-svh grid-cols-[repeat(auto-fit,minmax(360px,1fr))]">
      {variant === "register" ? <RegisterBrand /> : <SignInBrand />}
      <div className="flex items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-[400px]">
          {back && (
            <Link to={back.to} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-ink">
              <ArrowLeft size={14} strokeWidth={2} /> {back.label}
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
