import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { ROUTES } from "@/constants/routes";

// Design copy per variant (DiecastBD Landing Final.dc.html) — used only when
// the admin hasn't configured that field on the first hero slide, so a store
// with no hero content yet still shows something real rather than a blank
// section, without ever overriding real admin-entered copy.
const DEFAULT_COPY = {
  "lime-showroom": {
    title: "Own the",
    titleAccent: "original.",
    subtitle:
      "Hot Wheels Premium and MINI GT 1:64 — sourced direct, inspected piece by piece, and packed the way we'd pack our own.",
  },
  "dark-spotlight": {
    title: "Real metal.",
    titleAccent: "Zero fakes.",
    subtitle: "Hot Wheels Premium and MINI GT 1:64 under studio lights — sourced direct, inspected piece by piece, delivered nationwide.",
  },
  "photo-fullbleed": {
    title: "Authenticity,",
    titleAccent: "cast in metal.",
    subtitle: "Verified Hot Wheels Premium & MINI GT — one import batch, gone for good.",
  },
};

const BADGE_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 2.7v5.6c0 4.6-3.1 7.6-7 8.9-3.9-1.3-7-4.3-7-8.9V5.7L12 3z" />
    <path d="M9 11.8l2.1 2.1 4-4.2" />
  </svg>
);

// Same outer gutter every variant shares: 16px/12px-top on mobile (<768px),
// 40px/24px-top on desktop, replicating the reference's
// `max-width:1360px;margin:0 auto;padding:24px 40px 0` container exactly —
// including at viewport widths between 768–1360px, where a naive
// `mx-auto max-w-[1360px]` (no persistent side padding) would collapse to a
// 0px gutter. 1360 content + 40px padding each side = 1440px outer bound.
const HERO_WRAP = "mx-auto max-w-[1440px] px-4 pt-3 md:px-10 md:pt-6";

// The reference forces a hard line-break between the two title fragments on
// desktop only (mobile wraps them on one line, space-separated — its
// narrower column makes the break unnecessary there). A real admin-entered
// title has no second fragment to break before, so this renders as nothing
// when `accent` is empty.
function HeroTitle({ title, accent, italic, accentClassName, className }) {
  return (
    <h1 className={className}>
      {title}
      {accent && (
        <>
          {" "}
          <br className="hidden md:inline" />
          {italic ? <em className={`italic ${accentClassName ?? ""}`}>{accent}</em> : accent}
        </>
      )}
    </h1>
  );
}

function LimeShowroomHero({ title, titleAccent, subtitle, ctaText, ctaLink, imageUrl }) {
  return (
    <div className={HERO_WRAP}>
      <div className="overflow-hidden rounded-3xl bg-[radial-gradient(120%_140%_at_85%_0%,#BADD4D_0%,#A8CD2F_52%,#9CC12A_100%)] p-5.5 md:rounded-[28px] md:p-16">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <div className="inline-flex items-center gap-1.75 rounded-full bg-white/35 px-3 py-1.5 text-[11px] font-semibold text-[#1C2108] md:gap-2 md:px-4 md:py-2 md:text-[12.5px]">
              {BADGE_ICON}
              Every piece hand-verified
            </div>
            <HeroTitle
              title={title}
              accent={titleAccent}
              italic
              className="mt-3.5 font-display text-[33px] leading-[1.05] font-extrabold tracking-[-0.02em] text-ink md:mt-5.5 md:text-[clamp(44px,4.6vw,64px)] md:leading-[1.02] md:tracking-[-0.022em]"
            />
            <p className="mt-2.5 max-w-115 text-[13.5px] leading-[1.55] text-ink/78 md:mt-5 md:text-[17px] md:leading-[1.65]">{subtitle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3.5 md:mt-7.5">
              <Link
                to={ctaLink}
                className="flex h-12.5 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14.5px] font-semibold text-white transition-colors hover:bg-[#2A2E1C] md:h-auto md:w-auto md:px-7 md:py-3.75 md:text-[15px]"
              >
                {ctaText}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to={ROUTES.SHOP}
                className="hidden items-center gap-2 rounded-full border-[1.5px] border-ink/30 px-6.5 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:border-ink hover:bg-white/25 md:inline-flex"
              >
                New arrivals
              </Link>
            </div>
            <div className="mt-2.5 text-[11px] font-medium text-ink/60 md:mt-6.5 md:text-[13px]">
              Cash on delivery · bKash · BanglaQR — delivered nationwide
            </div>
          </div>
          <div className="relative h-42.5 md:h-110">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="absolute inset-0 size-full rounded-2xl object-cover" />
            ) : (
              <div className="absolute inset-0 rounded-2xl bg-white/15" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkSpotlightHero({ title, titleAccent, subtitle, ctaText, ctaLink, imageUrl }) {
  return (
    <div className={HERO_WRAP}>
      <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(120%_120%_at_85%_0%,#2A2E1C_0%,#14160C_55%,#0B0C06_100%)] p-5.5 md:rounded-[28px] md:px-16 md:py-18">
        <div className="pointer-events-none absolute -top-35 right-[6%] hidden size-115 rounded-full bg-[radial-gradient(circle,rgba(168,205,47,.2)_0%,rgba(168,205,47,0)_70%)] md:block" />
        <div className="relative grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className="relative">
            <div className="inline-flex items-center gap-1.75 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-brand-glow md:gap-2 md:px-4 md:py-2 md:text-[12.5px]">
              {BADGE_ICON}
              Every piece hand-verified
            </div>
            <HeroTitle
              title={title}
              accent={titleAccent}
              italic
              accentClassName="text-brand-glow"
              className="mt-3.5 font-display text-[33px] leading-[1.05] font-extrabold tracking-[-0.02em] text-white md:mt-5.5 md:text-[clamp(44px,4.6vw,64px)] md:leading-[1.02] md:tracking-[-0.022em]"
            />
            <p className="mt-2.5 max-w-115 text-[13.5px] leading-[1.55] text-[#A9AC9F] md:mt-5 md:text-[17px] md:leading-[1.65]">{subtitle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3.5 md:mt-7.5">
              <Link
                to={ctaLink}
                className="flex h-12.5 w-full items-center justify-center gap-2 rounded-full bg-brand text-[14.5px] font-bold text-ink transition-colors hover:bg-brand-bright md:h-auto md:w-auto md:px-7 md:py-3.75 md:text-[15px]"
              >
                {ctaText}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to={ROUTES.SHOP}
                className="hidden items-center gap-2 rounded-full border-[1.5px] border-white/28 px-6.5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white md:inline-flex"
              >
                New arrivals
              </Link>
            </div>
            <div className="mt-2.5 text-[11px] font-medium text-white/55 md:mt-6.5 md:text-[13px]">
              Cash on delivery · bKash · BanglaQR — delivered nationwide
            </div>
          </div>
          <div className="relative h-42.5 md:h-110">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="absolute inset-0 size-full rounded-2xl object-cover" />
            ) : (
              <div className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoFullbleedHero({ title, titleAccent, subtitle, ctaText, ctaLink, imageUrl }) {
  return (
    <div className={HERO_WRAP}>
      <div className="relative h-110 overflow-hidden rounded-3xl md:h-140 md:rounded-[28px]">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[rgba(10,11,5,.9)] via-[rgba(10,11,5,.35)] to-transparent md:bg-[linear-gradient(75deg,rgba(10,11,5,.82)_0%,rgba(10,11,5,.42)_48%,rgba(10,11,5,.02)_78%)]" />

        <div className="absolute top-6 right-6 hidden items-center rounded-full border border-white/18 bg-[rgba(13,15,7,.6)] px-4.5 py-2.25 text-[12.5px] font-semibold text-white backdrop-blur-lg md:flex">
          COD · bKash · BanglaQR
        </div>

        <div className="absolute inset-x-4.5 bottom-4.5 max-w-150 md:inset-x-auto md:left-14 md:bottom-13">
          <div className="inline-flex items-center gap-1.75 rounded-full border border-white/22 bg-white/14 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-lg md:px-4 md:py-2 md:text-[12.5px]">
            <span className="text-brand-glow">{BADGE_ICON}</span>
            Hand-verified authentic
          </div>
          <HeroTitle
            title={title}
            accent={titleAccent}
            italic={false}
            className="mt-3 font-display text-[30px] leading-[1.08] font-extrabold tracking-[-0.02em] text-white md:mt-4.5 md:text-[clamp(42px,4.2vw,58px)] md:leading-[1.04] md:tracking-[-0.022em]"
          />
          <p className="mt-2 max-w-115 text-[13px] leading-[1.55] text-white/85 md:mt-3.5 md:text-[16.5px] md:leading-[1.6]">{subtitle}</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-3.5 md:mt-6">
            <Link
              to={ctaLink}
              className="flex h-12.5 w-full items-center justify-center gap-2 rounded-full bg-brand text-[14.5px] font-extrabold text-ink transition-colors hover:bg-brand-bright md:h-auto md:w-auto md:px-7 md:py-3.75 md:text-[15px] md:font-bold"
            >
              {ctaText}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to={ROUTES.SHOP}
              className="hidden items-center gap-2 rounded-full border border-white/28 bg-white/14 px-6.5 py-3.5 text-[15px] font-semibold text-white backdrop-blur-lg transition-colors hover:border-white md:inline-flex"
            >
              New arrivals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const VARIANT_COMPONENT = {
  "lime-showroom": LimeShowroomHero,
  "dark-spotlight": DarkSpotlightHero,
  "photo-fullbleed": PhotoFullbleedHero,
};

/** Single static hero (no carousel — the multi-slide autoplay hero was
 * dropped per explicit user decision, since the design reference shows one
 * fixed hero, not a rotating banner). Three interchangeable visual styles
 * exist per the reference; `variant` is admin-selectable
 * (Settings → Homepage Sections → Hero style), default photo-fullbleed.
 * Content comes from the first configured `settings.heroBanner` slide
 * (title/subtitle/CTA/image), falling back to the design's own copy
 * per-field so an unconfigured store still shows a real hero. */
export function HeroSection({ slide, variant = "photo-fullbleed" }) {
  const copy = DEFAULT_COPY[variant] ?? DEFAULT_COPY["photo-fullbleed"];
  const Variant = VARIANT_COMPONENT[variant] ?? PhotoFullbleedHero;

  // The design's title/titleAccent split (plain text + a desktop-only line
  // break, italicized on two of the three variants) only makes sense for the
  // design's own default copy — an admin-entered title is one free-text
  // string with nowhere to carry a second "accent" fragment, so it renders
  // as-is with no split.
  const usingDefaultTitle = !slide?.title;

  return (
    <section className="border-b border-border pb-6 md:pb-0">
      <Variant
        title={slide?.title || copy.title}
        titleAccent={usingDefaultTitle ? copy.titleAccent : ""}
        subtitle={slide?.subtitle || copy.subtitle}
        ctaText={slide?.ctaText || "Explore the collection"}
        ctaLink={slide?.ctaLink || ROUTES.SHOP}
        imageUrl={slide?.image?.url}
      />
    </section>
  );
}
