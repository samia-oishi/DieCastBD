import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** One modal that renders as a centered dialog on desktop and a bottom sheet on
 * mobile (grab handle, rounded top) — the same pattern as RestockAlertDialog,
 * so every form modal on the site feels consistent on touch. */
export function ResponsiveModal({ open, onOpenChange, title, children, className }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn("gap-0 rounded-[20px] border border-line bg-white p-6 shadow-[0_24px_60px_rgba(16,18,8,0.2)] sm:max-w-lg", className)}
        >
          <DialogTitle className="font-display text-lg font-bold text-ink">{title}</DialogTitle>
          <div className="mt-4">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-[24px] border-0 bg-white px-5 pb-8 pt-3">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" aria-hidden />
        <SheetTitle className="font-display text-lg font-bold text-ink">{title}</SheetTitle>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
