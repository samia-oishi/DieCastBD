import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

/** 44px pill search input with a leading magnifier — one per list screen. */
export function AdminSearch({ value, onChange, placeholder = "Search…", className }) {
  return (
    <div className={cn("relative", className)}>
      <Search size={17} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-[13.5px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-[rgba(168,205,47,0.22)]"
      />
    </div>
  );
}
