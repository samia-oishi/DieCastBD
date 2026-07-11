import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { formatTaka } from "@/lib/currency";
import { ROUTES } from "@/constants/routes";

/** Mobile-only fixed Total + Checkout bar (dark glass), replacing the bottom nav
 * on the cart route. */
export function MobileCartBar({ total }) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-[22px] border border-white/16 bg-[rgba(13,15,7,0.92)] py-[10px] pl-5 pr-3 shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)] md:hidden">
      <div>
        <div className="text-[10px] font-semibold tracking-[0.06em] text-faint">TOTAL</div>
        <div className="font-display text-[18px] font-extrabold text-white">{formatTaka(total)}</div>
      </div>
      <Link to={ROUTES.CHECKOUT} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-extrabold text-ink">
        Checkout <ArrowRight size={15} strokeWidth={2.4} />
      </Link>
    </div>
  );
}
