import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

/** Admin modal per the prototypes: white sheet, 18px radius, min(480px, 100vw-32px),
 * with a round close button and a divider'd header/footer.
 *
 * Positioning is left ENTIRELY to shadcn's DialogContent (fixed, centred via
 * top/left-1/2 + -translate-1/2). Overriding top/bottom/translate here to force a
 * mobile bottom-sheet fought those defaults and pushed the sheet off-screen, so
 * the modal is centred at every width — which is also what the storefront's own
 * dialogs do. Built on shadcn so focus trap / Esc / scroll-lock come free.
 */
export function AdminModal({ title, description, open = true, onClose, children, footer, className }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent
        showCloseButton={false}
        // Width is set inline on purpose. shadcn caps it at BOTH the base and
        // `sm:` breakpoints, and tailwind-merge only dedupes within a variant —
        // chasing that with classes produced 720px, then 384px, then none.
        // An inline style is unambiguous and can't be out-specified.
        style={{ width: "min(480px, calc(100vw - 32px))", maxWidth: "none" }}
        className={cn(
          "gap-0 rounded-[18px] border border-line bg-white p-0 shadow-[0_20px_60px_rgba(16,18,8,0.4)] ring-0",
          className
        )}
      >
        <DialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-line-soft px-5 py-4 text-left">
          <div className="min-w-0">
            <DialogTitle className="font-display text-[16px] font-bold text-ink">{title}</DialogTitle>
            {description && <p className="mt-1 text-[12.5px] leading-[1.5] text-[#6B6E60]">{description}</p>}
          </div>
          <DialogClose className="flex size-8 shrink-0 items-center justify-center rounded-full text-faint transition-colors hover:bg-tile hover:text-ink">
            <X size={16} strokeWidth={2.2} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="max-h-[min(60vh,460px)] overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="border-t border-line-soft px-5 py-3.5">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
