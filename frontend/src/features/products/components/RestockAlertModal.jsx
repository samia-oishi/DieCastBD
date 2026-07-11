import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, CarFront } from "lucide-react";
import toast from "react-hot-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { formatPrice } from "@/lib/currency";
import { productThumbUrl } from "@/lib/cloudinary";
import { restockAlertSchema } from "../schemas/restockAlertSchema";
import { useRestockAlertMutation } from "../api/useProducts";

/** "Get a restock alert" modal — triggered by a sold-out ProductCard's
 * "Notify me" button (and, later, Wishlist/PDP equivalents). One shared
 * contact field (phone or BD number) rather than separate email/phone
 * inputs, matching the reference screenshot the design team supplied. */
export function RestockAlertModal({ product, open, onOpenChange }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(restockAlertSchema) });
  const mutation = useRestockAlertMutation();

  if (!product) return null;

  const onSubmit = ({ contact }) => {
    mutation.mutate(
      { productId: product._id, contact },
      {
        onSuccess: () => {
          toast.success("You're on the list — we'll message you the moment it's back.");
          onOpenChange(false);
          reset();
        },
        onError: () => toast.error("Couldn't set that alert — please try again."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] gap-5 p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-foreground">Get a restock alert</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/60 p-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            {product.thumbnail?.url ? (
              <img
                src={productThumbUrl(product.thumbnail.url)}
                alt=""
                className="size-full object-contain p-1"
              />
            ) : (
              <CarFront className="size-6 text-muted-foreground/40" strokeWidth={1.25} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {product.brand?.name && (
              <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{product.brand.name}</div>
            )}
            <div className="truncate text-sm font-medium text-foreground">{product.title}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{formatPrice(product.salePrice ?? product.price)}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                Sold out
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Premium runs rarely come back — but if this one does, you'll be the first to know.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Field data-invalid={!!errors.contact}>
            <FieldLabel htmlFor="restock-contact">Phone or email</FieldLabel>
            <Input id="restock-contact" placeholder="01XXXXXXXXX or you@email.com" {...register("contact")} />
            <FieldError errors={errors.contact ? [errors.contact] : undefined} />
          </Field>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-11 w-full rounded-full bg-brand font-bold text-ink hover:bg-brand-bright"
          >
            <Bell className="size-4 fill-current" />
            {mutation.isPending ? "Setting your alert..." : "Set my alert"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">One message only if it's back — no spam, ever.</p>
      </DialogContent>
    </Dialog>
  );
}
