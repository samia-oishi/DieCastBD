import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser, useLogoutMutation } from "@/features/auth/api/useAuth";
import { CheckoutSteps } from "./CheckoutSteps";
import logo from "@/assets/logo/diecastbdLight.png";

const FROST = "bg-[rgba(250,250,247,0.6)] [backdrop-filter:blur(24px)_saturate(180%)] [-webkit-backdrop-filter:blur(24px)_saturate(180%)]";

/** Dedicated checkout header (replaces the storefront nav on /checkout), matching
 * the design: logo · centered progress stepper · auth actions. Guests get
 * Sign in / Create account; signed-in users get their name + Sign out. */
export function CheckoutHeader() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogoutMutation();

  const onSignOut = () => logout.mutate(undefined, { onSuccess: () => navigate(ROUTES.HOME) });

  return (
    <>
      {/* Desktop */}
      <header className={cn("sticky top-0 z-50 hidden border-b border-line md:block", FROST)}>
        <div className="mx-auto flex h-[74px] max-w-[1360px] items-center justify-between gap-8 px-10">
          <Link to={ROUTES.HOME} className="shrink-0">
            <img src={logo} alt="DiecastBD" className="block h-10 w-auto" />
          </Link>

          <CheckoutSteps />

          {user ? (
            <div className="flex items-center gap-3.5">
              <span className="text-sm font-semibold text-ink">{user.name}</span>
              <button
                type="button"
                onClick={onSignOut}
                disabled={logout.isPending}
                className="rounded-full border border-line bg-white px-5 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3.5">
              <Link to={`${ROUTES.LOGIN}?redirect=/checkout`} className="text-sm font-semibold text-ink">
                Sign in
              </Link>
              <Link
                to={`${ROUTES.REGISTER}?redirect=/checkout`}
                className="rounded-full bg-brand px-[22px] py-[11px] text-sm font-bold text-ink transition-colors hover:bg-brand-bright"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile — back · title */}
      <header className={cn("sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(231,232,224,0.6)] px-4 py-3 md:hidden", FROST)}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex size-[38px] items-center justify-center rounded-full border border-line bg-white text-ink"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <span className="font-display text-[17px] font-bold text-ink">Checkout</span>
        <div className="w-[38px]" />
      </header>
    </>
  );
}
