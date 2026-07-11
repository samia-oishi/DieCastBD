import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "title-asc", label: "Name: A to Z" },
];

/** Pill-styled sort select. `prefix` renders "Sort:" before the value on desktop;
 * the mobile chip omits it. */
export function SortDropdown({ value, onChange, prefix = false, className }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-auto gap-2 rounded-full border-line bg-white px-[18px] py-3 text-sm font-semibold text-ink",
          className
        )}
      >
        {prefix && <span>Sort:</span>}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
