import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Bell, Check } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { restockAlertSchema } from "@/features/products/schemas/restockAlertSchema";
import { useRestockAlertMutation } from "@/features/products/api/useRestockAlertMutation";

function ProductSummary({ product }) {
  const price = product.salePrice ?? product.price;
  return (
    <div className="mt-[18px] flex items-center gap-3.5 rounded-[16px] border border-line-soft bg-paper p-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-[12px] border border-line-soft bg-white">
        {product.thumbnail?.url && (
          <img src={cloudinaryCard(product.thumbnail.url)} alt="" className="absolute inset-[6%] size-[88%] object-contain" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[0.09em] text-faint">{product.brand?.name}</div>
        <div className="mt-[3px] line-clamp-2 text-[13.5px] font-semibold leading-[1.3] text-ink">{product.title}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[13.5px] font-bold text-faint">{formatTaka(price)}</div>
        <div className="mt-[3px] text-[9.5px] font-bold uppercase tracking-[0.06em] text-danger">Sold out</div>
      </div>
    </div>
  );
}

function RestockAlertBody({ product, onClose }) {
  const [done, setDone] = useState(false);
  const mutation = useRestockAlertMutation(product._id);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(restockAlertSchema) });

  const onSubmit = ({ contact }) => {
    mutation.mutate(contact, { onSuccess: () => setDone(true) });
  };

  if (done) {
    return (
      <div className="px-2 pb-0.5 pt-2 text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-brand text-ink shadow-[0_8px_24px_rgba(168,205,47,0.4)]">
          <Check size={24} strokeWidth={2.6} />
        </div>
        <div className="mt-4 font-display text-[21px] font-extrabold tracking-[-0.01em] text-ink">You're on the list.</div>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-muted-foreground">
          If <b className="text-ink">{product.title}</b> ever returns, you'll hear it first — one SMS or email, nothing else.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-[#2A2E1C]"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex items-center justify-between gap-3">
        <DialogOrSheetHeading>Get a restock alert</DialogOrSheetHeading>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-line text-ink"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <ProductSummary product={product} />

      <p className="mt-4 text-[13.5px] leading-[1.6] text-ink-soft">
        Premium runs rarely come back — but if this one does, you'll be the first to know.
      </p>

      <div className="mt-4">
        <label htmlFor="restock-contact" className="mb-[7px] block text-[12.5px] font-semibold text-ink">Phone or email</label>
        <input
          id="restock-contact"
          autoFocus
          placeholder="01XXXXXXXXX or you@email.com"
          {...register("contact")}
          className="w-full rounded-[12px] border border-line bg-paper px-4 py-[13px] text-[13.5px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        {errors.contact && <p className="mt-1.5 text-xs text-danger">{errors.contact.message}</p>}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-4 flex h-[50px] w-full items-center justify-center gap-2.5 rounded-full bg-brand text-[14.5px] font-bold text-ink transition-colors hover:bg-brand-bright disabled:opacity-60"
      >
        <Bell size={15} strokeWidth={2} />
        {mutation.isPending ? "Setting…" : "Set my alert"}
      </button>
      <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-faint">One message only if it's back — no spam, ever.</p>
    </form>
  );
}

// The visible heading doubles as the accessible dialog/sheet title. Rendered via
// context-free plain element; the a11y Title is provided separately (sr-only) by
// the wrapper so Radix is satisfied in both the form and success steps.
function DialogOrSheetHeading({ children }) {
  return <div className="font-display text-[19px] font-extrabold tracking-[-0.01em] text-ink">{children}</div>;
}

export function RestockAlertDialog({ product, open, onOpenChange }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [key, setKey] = useState(0);

  // Reset the inner step (form/success) each time the dialog re-opens.
  useEffect(() => {
    if (open) setKey((k) => k + 1);
  }, [open]);

  const close = () => onOpenChange(false);
  const body = <RestockAlertBody key={key} product={product} onClose={close} />;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-[440px] max-w-[calc(100%-48px)] gap-0 rounded-[24px] border-0 bg-white p-[26px_28px_28px] shadow-[0_24px_60px_rgba(16,18,8,0.3)]"
        >
          <DialogTitle className="sr-only">Restock alert</DialogTitle>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-[24px] border-0 bg-white px-5 pb-8 pt-3">
        <SheetTitle className="sr-only">Restock alert</SheetTitle>
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" aria-hidden />
        {body}
      </SheetContent>
    </Sheet>
  );
}
