import { AnimatePresence, motion } from "framer-motion";

import { AdminButton } from "./AdminButton";

/** Floating dark-glass "Unsaved changes" bar. Driven by RHF `isDirty`; Discard
 * should call `reset()`. Shared by the product form, settings, customer detail
 * and the page builder. */
export function SaveBar({ dirty, onDiscard, onSave, saving, saveLabel = "Save", label = "Unsaved changes" }) {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex justify-center">
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex w-full items-center gap-3 rounded-[22px] border border-white/16 bg-[rgba(13,15,7,0.94)] py-2.5 pl-4 pr-2.5 shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)] md:w-auto md:min-w-[440px]"
          >
            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#DDDFD2]">
              <span className="size-2 shrink-0 rounded-full bg-brand" aria-hidden />
              <span>{label}</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              {onDiscard && (
                <AdminButton type="button" variant="glass" size="sm" onClick={onDiscard} disabled={saving}>
                  Discard
                </AdminButton>
              )}
              <AdminButton type={onSave ? "button" : "submit"} size="sm" onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : saveLabel}
              </AdminButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
