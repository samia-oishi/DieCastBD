import { Container } from "@/components/shared/Container";

export function CollectorPromiseSection({ title, description }) {
  if (!title && !description) return null;

  return (
    <section className="border-t border-border py-20">
      <Container size="narrow" className="flex flex-col items-center gap-4 text-center">
        {title && <h2 className="font-heading text-2xl text-foreground sm:text-3xl">{title}</h2>}
        {description && <p className="text-balance leading-relaxed text-muted-foreground">{description}</p>}
      </Container>
    </section>
  );
}
