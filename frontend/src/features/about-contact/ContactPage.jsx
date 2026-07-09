import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { useSettings } from "@/features/settings/api/useSettings";
import { contactSchema } from "./schemas/contactSchema";
import { useSubmitContactMessageMutation } from "./api/useContact";

export function ContactPage() {
  const { data: settings } = useSettings();
  const contact = settings?.contactInfo ?? {};
  const hasContactInfo = contact.email || contact.phone || contact.address;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(contactSchema) });

  const submitMutation = useSubmitContactMessageMutation();

  const onSubmit = (values) => {
    submitMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Message sent — we'll get back to you soon.");
        reset();
      },
      onError: (err) => toast.error(err.response?.data?.message ?? "Could not send message"),
    });
  };

  return (
    <>
      <Helmet>
        <title>Contact Us — DiecastBD</title>
        <meta name="description" content="Get in touch with DiecastBD for questions about orders, products, or anything else." />
      </Helmet>

      <Container size="narrow" className="flex flex-col gap-10 py-16">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-heading text-3xl text-foreground sm:text-4xl">Contact Us</h1>
          <p className="text-muted-foreground">Questions about an order, a product, or anything else — we're here to help.</p>
        </div>

        {hasContactInfo && (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="size-4" /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary">
                <Phone className="size-4" /> {contact.phone}
              </a>
            )}
            {contact.address && (
              <span className="flex items-center gap-2">
                <MapPin className="size-4" /> {contact.address}
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto flex w-full max-w-md flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" {...register("name")} />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" {...register("email")} />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>
            <Field data-invalid={!!errors.message}>
              <FieldLabel htmlFor="message">Message</FieldLabel>
              <Textarea id="message" rows={5} {...register("message")} />
              <FieldError errors={errors.message ? [errors.message] : undefined} />
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </Container>
    </>
  );
}
