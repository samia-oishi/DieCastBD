import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
import { newsletterSchema } from "../schemas/newsletterSchema";
import { useSubscribeMutation } from "../api/useNewsletter";

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

  // Footer variant: dark pill input + lime "Join" button, matching the design's
  // "The drop list" newsletter row on the dark ink footer.
  if (variant === "footer") {
    if (subscribeMutation.isSuccess) {
      return <p className="mt-4 text-sm font-medium text-brand">You're on the list — thanks for joining.</p>;
    }
    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 flex gap-2.5">
        <div className="flex-1">
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Email address"
            {...register("email")}
            className="w-full rounded-full border border-white/14 bg-white/[0.07] px-5 py-3 text-[13.5px] text-white placeholder:text-[#8A8D80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          {errors.email && <p className="mt-1.5 pl-2 text-xs text-[#E9A9A2]">{errors.email.message}</p>}
        </div>
        <button
          type="submit"
          disabled={subscribeMutation.isPending}
          className="shrink-0 rounded-full bg-brand px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-brand-bright disabled:opacity-60"
        >
          {subscribeMutation.isPending ? "Joining..." : "Join"}
        </button>
      </form>
    );
  }

  if (subscribeMutation.isSuccess) {
    return <p className="text-sm text-primary">You're subscribed — thanks for joining.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:items-start">
      <Field data-invalid={!!errors.email} className="flex-1">
        <Input type="email" placeholder="Your email address" {...register("email")} />
        <FieldError errors={errors.email ? [errors.email] : undefined} />
      </Field>
      <Button type="submit" disabled={subscribeMutation.isPending}>
        {subscribeMutation.isPending ? "Joining..." : "Subscribe"}
      </Button>
    </form>
  );
}
