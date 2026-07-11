import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
import { newsletterSchema } from "../schemas/newsletterSchema";
import { useSubscribeMutation } from "../api/useNewsletter";

export function NewsletterForm() {
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
