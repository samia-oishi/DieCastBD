/** Typography for merchant-authored rich text (Tiptap HTML rendered via
 * dangerouslySetInnerHTML). One constant shared by CMS pages, policy pages and
 * collection landing content, so the three surfaces can't drift apart. */
export const PROSE =
  "flex flex-col gap-3 text-[14.5px] leading-[1.7] text-ink-soft [&_a]:font-semibold [&_a]:text-brand-deep [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-[17.5px] [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-4 [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-ink [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc";
