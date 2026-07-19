import { useState } from "react";
import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { Plus, Minus } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { Seo } from "@/components/shared/Seo";
import { canonical } from "@/lib/siteUrl";
import { useSettings } from "@/features/settings/api/useSettings";

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-white">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 p-[18px_20px] text-left">
        <span className="text-[15px] font-bold text-ink">{faq.question}</span>
        <span
          className={
            open
              ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-ink"
              : "flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-ink"
          }
        >
          {open ? <Minus size={12} strokeWidth={2.6} /> : <Plus size={12} strokeWidth={2.6} />}
        </span>
      </button>
      {open && <div className="px-5 pb-[18px] text-sm leading-[1.65] text-ink-soft">{faq.answer}</div>}
    </div>
  );
}

export function FaqPage() {
  const { data: settings } = useSettings();
  const faqs = settings?.faqs ?? [];
  const [openIndex, setOpenIndex] = useState(0);

  // FAQPage rich result — only when the merchant has published real Q&As.
  // No content = no schema (never fabricate to match a mock).
  const faqJsonLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs
          .filter((f) => f?.question && f?.answer)
          .map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
      }
    : null;

  return (
    <>
      <Seo title="FAQ" description="The questions collectors actually ask — authenticity, delivery, payments, packing, and returns.">
        <link rel="canonical" href={canonical("/faq")} />
        <meta property="og:url" content={canonical("/faq")} />
      </Seo>
      {faqJsonLd?.mainEntity?.length ? (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        </Helmet>
      ) : null}
      <div className="mx-auto w-full max-w-[780px] px-4 pb-10 pt-8 md:px-6 md:pt-11">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink md:text-[38px]">Straight answers.</h1>
        <p className="mt-2.5 text-[15px] text-muted-foreground">The questions collectors actually ask — no fine print runaround.</p>

        {faqs.length === 0 ? (
          <p className="mt-7 text-sm text-muted-foreground">
            No questions published yet — reach out via our <Link to={ROUTES.CONTACT} className="font-bold text-ink">contact page</Link> and we'll help directly.
          </p>
        ) : (
          <div className="mt-7 flex flex-col gap-2.5">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
            ))}
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-ink p-6">
          <div>
            <div className="font-display text-[17px] font-bold text-white">Still stuck?</div>
            <div className="mt-1 text-[13px] text-[#A9AC9F]">Message us — we usually reply within the hour.</div>
          </div>
          <Link to={ROUTES.CONTACT} className="rounded-full bg-brand px-6 py-3 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright">
            Contact us
          </Link>
        </div>
      </div>
    </>
  );
}
