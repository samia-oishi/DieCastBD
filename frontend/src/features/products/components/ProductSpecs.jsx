const FIELD_LABELS = {
  manufacturer: "Manufacturer",
  series: "Series",
  modelNumber: "Model Number",
  scale: "Scale",
  material: "Material",
  color: "Color",
};

export function ProductSpecs({ product }) {
  const baseSpecs = Object.entries(FIELD_LABELS).filter(([key]) => product[key]);
  const extraSpecs = Object.entries(product.specifications ?? {});
  const allSpecs = [...baseSpecs, ...extraSpecs];

  if (allSpecs.length === 0 && !product.features?.length) return null;

  return (
    <div className="flex flex-col gap-6">
      {allSpecs.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg text-foreground">Specifications</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {allSpecs.map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-border py-2 text-sm">
                <dt className="text-muted-foreground">{FIELD_LABELS[key] ?? key}</dt>
                <dd className="font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {product.features?.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg text-foreground">Features</h2>
          <ul className="flex flex-col gap-1.5">
            {product.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
