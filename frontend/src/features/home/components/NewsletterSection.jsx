import { NewsletterForm } from "@/features/newsletter/components/NewsletterForm";

export function NewsletterSection() {
  return (
    <section className="border-t border-border px-6 py-16 sm:px-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <h2 className="font-heading text-2xl text-foreground sm:text-3xl">Stay in the Loop</h2>
        <p className="text-sm text-muted-foreground">
          New arrivals, restocks, and collector drops — straight to your inbox.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
}
