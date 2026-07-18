import toast from "react-hot-toast";
import { Check } from "lucide-react";

/** Admin toast — dark-glass pill with a lime check circle, per the redesign.
 * The app's global <Toaster> is top-center with light styling; admin actions
 * use this instead (bottom-right on desktop, bottom-center on mobile). Custom
 * render gives full control over the dark-glass look regardless of the Toaster's
 * defaults. Returns the toast id so callers can dismiss early if needed. */
export function adminToast(message, { duration = 2400 } = {}) {
  const position = typeof window !== "undefined" && window.innerWidth < 768 ? "bottom-center" : "bottom-right";

  return toast.custom(
    (t) => (
      <div
        className="flex items-center gap-2.5 rounded-full border border-white/16 bg-[rgba(13,15,7,0.94)] py-2 pl-2 pr-4 shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)]"
        style={{
          transition: "opacity 220ms ease, transform 220ms ease",
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? "translateY(0)" : "translateY(14px)",
        }}
      >
        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brand text-ink">
          <Check size={15} strokeWidth={3} />
        </span>
        <span className="text-[13.5px] font-semibold text-white">{message}</span>
      </div>
    ),
    { duration, position }
  );
}
