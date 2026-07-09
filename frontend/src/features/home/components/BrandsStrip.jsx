export function BrandsStrip({ brands }) {
  if (!brands?.length) return null;

  return (
    <section className="border-t border-border px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center font-heading text-2xl text-foreground sm:text-3xl">Our Brands</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {brands.map((brand) =>
            brand.logo?.url ? (
              <img key={brand._id} src={brand.logo.url} alt={brand.name} className="h-8 w-auto opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0" />
            ) : (
              <span key={brand._id} className="font-heading text-lg tracking-wide text-muted-foreground">
                {brand.name}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}
