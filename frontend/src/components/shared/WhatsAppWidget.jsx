import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { WhatsAppIcon } from "@/components/shared/SocialIcons";
import { useSettings } from "@/features/settings/api/useSettings";

/** Floating WhatsApp chat entry, bottom-right on every storefront page.
 *
 * Renders ONLY when the merchant has a WhatsApp link saved in Settings →
 * Contact & social — no invented number, no dead button (project rule). The
 * FAB stays WhatsApp green rather than brand lime on purpose: for a chat
 * affordance, instant recognition beats palette purity.
 *
 * Mobile position maths: every public route docks a bar at `inset-x-3
 * bottom-3` × ~66px (bottom nav / buy bar / cart bar), so the FAB floats at
 * bottom-[86px] — 8px above them — and drops to bottom-6 on md where those
 * bars don't exist. z-40 keeps it on the storefront-bar tier, *below* sheets
 * and dialogs (z-50) so the cart drawer covers it instead of fighting it.
 */
export function WhatsAppWidget() {
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const fabRef = useRef(null);

  const whatsapp = settings?.socialLinks?.whatsapp;

  // Outside-tap / Escape closing via listeners, not a backdrop — a backdrop
  // would hijack page scrolling and clicks for a widget this small.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!whatsapp) return null;

  // Same normalisation as the contact page: full URLs (incl. wa.me/message/…
  // short links) pass through verbatim; a bare number becomes a wa.me link.
  const href = /^https?:/.test(whatsapp) ? whatsapp : `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  return (
    <div ref={containerRef} className="fixed bottom-[86px] right-3 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-label="Chat with DiecastBD on WhatsApp"
            className="w-[290px] overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_16px_44px_rgba(16,18,8,0.18)]"
          >
            <div className="flex items-center justify-between gap-3 bg-ink px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <WhatsAppIcon className="size-4" />
                </span>
                <div>
                  <div className="text-[13.5px] font-bold text-white">DiecastBD</div>
                  <div className="text-[11px] text-[#C7C9BC]">WhatsApp chat</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat panel"
                className="flex size-7 items-center justify-center rounded-full text-[#C7C9BC] transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="px-4 py-4">
              <p className="text-[13.5px] leading-[1.6] text-ink-soft">
                Questions about a model or an order? Chat with us on WhatsApp.
              </p>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] font-display text-[13.5px] font-bold text-white transition-colors hover:bg-[#1FBF5B]"
              >
                <WhatsAppIcon className="size-4" />
                Start chat
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Chat on WhatsApp"
        className="flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(16,18,8,0.28)] transition-transform hover:scale-105 active:scale-95"
      >
        <WhatsAppIcon className="size-7" />
      </button>
    </div>
  );
}
