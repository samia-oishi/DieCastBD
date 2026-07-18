import { AnimatePresence, motion } from "framer-motion";

/** Floating dark-glass bulk-actions bar (Orders, Products). Shows a lime count
 * badge + "selected" and the caller's action buttons; rises in when count > 0.
 * Full-width inset on mobile, centered min-440 on desktop. */
export function BulkBar({ count, children }) {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex justify-center">
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-auto flex w-full items-center gap-3 rounded-[22px] border border-white/16 bg-[rgba(13,15,7,0.94)] py-2.5 pl-4 pr-2.5 shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)] md:w-auto md:min-w-[440px]"
          >
            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#DDDFD2]">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-ink">{count}</span>
              <span>selected</span>
            </span>
            <div className="ml-auto flex items-center gap-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
