import { NewsletterForm } from "@/features/newsletter/components/NewsletterForm";
import { Container } from "@/components/shared/Container";

export function NewsletterSection() {
  return (
    <section className="border-t border-border py-16">
      <Container size="narrow" className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-heading text-2xl text-foreground sm:text-3xl">Stay in the Loop</h2>
        <p className="text-sm text-muted-foreground">
          New arrivals, restocks, and collector drops — straight to your inbox.
        </p>
        <NewsletterForm />
      </Container>
    </section>
  );
}
