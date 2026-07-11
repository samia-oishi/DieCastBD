import { Check } from "lucide-react";

const FIELD_LABELS = {
  manufacturer: "Manufacturer",
  series: "Series",
  modelNumber: "Model Number",
  scale: "Scale",
  material: "Material",
  color: "Color",
};

function SectionTitle({ children }) {
  return <div className="font-display text-lg font-bold text-ink">{children}</div>;
}

/** Specifications rows + Features checklist, matching the PDP design. */
export function ProductSpecs({ product, className }) {
  const rows = [
    product.brand?.name && ["Brand", product.brand.name],
    ...Object.entries(FIELD_LABELS)
      .filter(([key]) => product[key])
      .map(([key]) => [FIELD_LABELS[key], product[key]]),
    ...Object.entries(product.specifications ?? {}),
  ].filter(Boolean);

  const hasSpecs = rows.length > 0;
  const hasFeatures = product.features?.length > 0;
  if (!hasSpecs && !hasFeatures) return null;

  return (
    <div className={className}>
      {hasSpecs && (
        <div>
          <SectionTitle>Specifications</SectionTitle>
          <div className="mt-1.5">
            {rows.map(([label, value], i) => (
              <div
                key={label}
                className={`flex justify-between gap-5 py-3 text-[13.5px] ${i < rows.length - 1 ? "border-b border-line-soft" : ""}`}
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-semibold text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasFeatures && (
        <div className="mt-[26px]">
          <SectionTitle>Features</SectionTitle>
          <div className="mt-3 flex flex-col gap-2.5">
            {product.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
                <Check size={15} strokeWidth={2.4} className="shrink-0 text-brand-deep" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
