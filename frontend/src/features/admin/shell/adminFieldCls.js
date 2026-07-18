// Admin form field styling, straight from the prototypes: 44px tall, 12px
// radius, 1px #E7E8E0 border, 13.5px text, lime focus ring
// (border #A8CD2F + 3px rgba(168,205,47,.22)). shadcn's defaults are 32px, so
// every admin Input/Textarea/SelectTrigger takes these classes.
export const adminInputCls =
  "h-11 w-full min-w-0 rounded-[12px] border border-line bg-white px-3.5 py-0 text-[13.5px] text-ink placeholder:text-faint outline-none transition-colors focus:border-brand focus:ring-[3px] focus:ring-[rgba(168,205,47,0.22)] focus-visible:ring-[3px] disabled:opacity-50";

export const adminTextareaCls =
  "w-full min-w-0 rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint outline-none transition-colors focus:border-brand focus:ring-[3px] focus:ring-[rgba(168,205,47,0.22)] focus-visible:ring-[3px] disabled:opacity-50";
