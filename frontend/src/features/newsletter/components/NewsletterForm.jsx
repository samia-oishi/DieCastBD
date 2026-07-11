import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
import { newsletterSchema } from "../schemas/newsletterSchema";
import { useSubscribeMutation } from "../api/useNewsletter";

// "footer" is a purely visual variant (pill input on a translucent-dark
// field, lime pill button) for the redesigned SiteFooter's "drop list"
// panel — same form/validation/mutation as the default, just restyled.
export function NewsletterForm({ variant = "default" }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(newsletterSchema) });

  const subscribeMutation = useSubscribeMutation();

  const onSubmit = ({ email }) => {
    subscribeMutation.mutate(email, { onSuccess: () => reset() });
  };

  const isFooter = variant === "footer";

  if (subscribeMutation.isSuccess) {
    return (
      <p className={cn("text-sm", isFooter ? "text-brand-glow" : "text-primary")}>
        You're subscribed — thanks for joining.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn("flex w-full max-w-sm flex-col gap-2", isFooter ? "sm:flex-row sm:items-center" : "sm:flex-row sm:items-start")}
    >
      <Field data-invalid={!!errors.email} className="flex-1">
        <Input
          type="email"
          placeholder="Your email address"
          className={
            isFooter
              ? "h-11.5 rounded-full border-white/14 bg-white/7 px-5 text-white placeholder:text-faint focus-visible:border-brand focus-visible:ring-brand/30"
              : undefined
          }
          {...register("email")}
        />
        <FieldError errors={errors.email ? [errors.email] : undefined} />
      </Field>
      <Button
        type="submit"
        disabled={subscribeMutation.isPending}
        className={isFooter ? "h-11.5 shrink-0 rounded-full bg-brand px-6 font-bold text-ink hover:bg-brand-bright" : undefined}
      >
        {subscribeMutation.isPending ? "Joining..." : "Join"}
      </Button>
    </form>
  );
}
