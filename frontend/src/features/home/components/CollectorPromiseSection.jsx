export function CollectorPromiseSection({ title, description }) {
  if (!title && !description) return null;

  return (
    <section className="border-t border-border px-6 py-20 sm:px-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        {title && <h2 className="font-heading text-2xl text-foreground sm:text-3xl">{title}</h2>}
        {description && <p className="text-balance leading-relaxed text-muted-foreground">{description}</p>}
      </div>
    </section>
  );
}
