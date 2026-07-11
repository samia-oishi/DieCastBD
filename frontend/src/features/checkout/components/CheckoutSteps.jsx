import { Link } from "react-router";
import { Check } from "lucide-react";

import { ROUTES } from "@/constants/routes";

function Bar() {
  return <span className="h-[1.5px] w-7 bg-[#DDDFD2]" />;
}

/** Cart ✓ → 2 Checkout → 3 Done progress indicator. */
export function CheckoutSteps({ className }) {
  return (
    <div className={`flex items-center gap-2 text-[13px] font-semibold ${className ?? ""}`}>
      <Link to={ROUTES.CART} className="flex items-center gap-[7px] text-brand-deep">
        <span className="flex size-5 items-center justify-center rounded-full bg-brand text-ink"><Check size={11} strokeWidth={3} /></span>
        Cart
      </Link>
      <Bar />
      <span className="flex items-center gap-[7px] text-ink">
        <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[10.5px] font-bold text-white">2</span>
        Checkout
      </span>
      <Bar />
      <span className="flex items-center gap-[7px] text-faint">
        <span className="flex size-5 items-center justify-center rounded-full border-[1.5px] border-[#DDDFD2] text-[10.5px] font-bold text-faint">3</span>
        Done
      </span>
    </div>
  );
}
