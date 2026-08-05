import { Link } from "react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { formatTaka } from "@/lib/currency";
import { cloudinaryHero, cloudinaryHeroSrcSet } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

// Shipped design copy for each hero style. This is the real, live content — an
// admin can override any field per variant from Settings, but a blank field
// falls back here, so an un-edited hero renders exactly as it ships. titleLine2
// is the emphasized (italic / lime) part of the headline.
const DEFAULTS = {
  "lime-showroom": {
    badge: "Every piece hand-verified",
    titleLine1: "Own the",
    titleLine2: "original.",
    subtitle:
      "Hot Wheels Premium and MINI GT 1:64 — sourced direct, inspected piece by piece, and packed the way we'd pack our own.",
    primaryCtaText: "Explore the collection",
    primaryCtaLink: ROUTES.SHOP,
    secondaryCtaText: "New arrivals",
    secondaryCtaLink: ROUTES.SHOP,
    footnote: "Cash on delivery · bKash · BanglaQR — delivered nationwide",
  },
  "dark-spotlight": {
    badge: "Every piece hand-verified",
    titleLine1: "Real metal.",
    titleLine2: "Zero fakes.",
    subtitle:
      "Hot Wheels Premium and MINI GT 1:64 under studio lights — sourced direct, inspected piece by piece, delivered nationwide.",
    primaryCtaText: "Explore the collection",
    primaryCtaLink: ROUTES.SHOP,
    secondaryCtaText: "New arrivals",
    secondaryCtaLink: ROUTES.SHOP,
    footnote: "Cash on delivery · bKash · BanglaQR — delivered nationwide",
  },
  "photo-fullbleed": {
    badge: "Hand-verified authentic",
    titleLine1: "Authenticity,",
    titleLine2: "cast in metal.",
    subtitle: "Verified Hot Wheels Premium & MINI GT — one import batch, gone for good.",
    primaryCtaText: "Explore the collection",
    primaryCtaLink: ROUTES.SHOP,
    secondaryCtaText: "New arrivals",
    secondaryCtaLink: ROUTES.SHOP,
    footnote: "COD · bKash · BanglaQR",
  },
};

// Merge admin-supplied content over the variant defaults. A field counts as
// "set" only when it has non-whitespace text, so clearing a field in admin
// restores the shipped copy rather than rendering an empty headline.
function resolveCopy(variant, content) {
  const defaults = DEFAULTS[variant] ?? DEFAULTS["lime-showroom"];
  const c = content ?? {};
  const pick = (key) => {
    const value = typeof c[key] === "string" ? c[key].trim() : "";
    return value || defaults[key];
  };
  return {
    badge: pick("badge"),
    titleLine1: pick("titleLine1"),
    titleLine2: pick("titleLine2"),
    subtitle: pick("subtitle"),
    primaryCtaText: pick("primaryCtaText"),
    primaryCtaLink: pick("primaryCtaLink"),
    secondaryCtaText: pick("secondaryCtaText"),
    secondaryCtaLink: pick("secondaryCtaLink"),
    footnote: pick("footnote"),
  };
}

function HeroImage({ image, className, radius = "rounded-[16px] md:rounded-[24px]" }) {
  if (image?.url) {
    return (
      <img
        src={cloudinaryHero(image.url)}
        srcSet={cloudinaryHeroSrcSet(image.url)}
        // PanelHero caps the image at half a 1360px shell on desktop; PhotoHero
        // runs full-bleed. 100vw below md, ~half the shell above it.
        sizes="(min-width: 768px) 50vw, 100vw"
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className={cn("size-full object-cover", radius, className)}
      />
    );
  }
  return (
    <div className={cn("flex size-full items-center justify-center border border-dashed border-black/15 bg-black/[0.03] text-xs text-faint", radius, className)}>
      Hero image
    </div>
  );
}

function HighlightCard({ card, tone }) {
  if (!card?.enabled || !card?.title) return null;
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-5 right-5 rounded-[16px] px-[18px] py-3",
        dark
          ? "border border-white/16 bg-[rgba(13,15,7,0.78)] [backdrop-filter:blur(16px)]"
          : "bg-white shadow-[0_8px_28px_rgba(16,18,8,0.18)]"
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-faint">{card.kicker}</div>
      <div className={cn("mb-0.5 mt-[3px] text-[13.5px] font-semibold", dark ? "text-white" : "text-ink")}>{card.title}</div>
      <div className={cn("text-[13.5px] font-bold", dark ? "text-brand-glow" : "text-ink")}>{formatTaka(card.price)}</div>
    </div>
  );
}

function VerifiedBadge({ label, tone }) {
  const styles = {
    lime: "bg-white/35 text-[#1C2108]",
    dark: "border border-white/14 bg-white/[0.08] text-brand-glow",
    glass: "border border-white/22 bg-white/14 text-white [backdrop-filter:blur(16px)]",
  };
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold md:px-4 md:text-[12.5px]", styles[tone])}>
      <ShieldCheck size={13} strokeWidth={2} className={tone === "glass" ? "text-brand-glow" : undefined} />
      <span>{label}</span>
    </div>
  );
}

function PrimaryCta({ text, to, tone }) {
  const styles = tone === "lime-ink"
    ? "bg-ink text-white hover:bg-[#2A2E1C]"
    : "bg-brand text-ink hover:bg-brand-bright";
  return (
    <Link
      to={to}
      className={cn("inline-flex h-[50px] items-center justify-center gap-2.5 rounded-full px-7 text-[14.5px] font-bold transition-colors md:h-auto md:py-[15px] md:text-[15px]", styles)}
    >
      {text} <ArrowRight size={16} strokeWidth={2} />
    </Link>
  );
}

function SecondaryCta({ text, to, tone }) {
  const styles = {
    lime: "border-[1.5px] border-black/30 text-ink hover:border-ink hover:bg-white/25",
    dark: "border-[1.5px] border-white/28 text-white hover:border-white",
  };
  return (
    <Link to={to} className={cn("hidden items-center gap-2 rounded-full px-[26px] py-[14px] text-[15px] font-semibold transition-colors md:inline-flex", styles[tone])}>
      {text}
    </Link>
  );
}

function PanelHero({ image, highlightCard, tone, copy }) {
  const dark = tone === "dark";
  return (
    <div className="mx-auto mt-3 max-w-[1360px] px-4 md:mt-0 md:px-10 md:pt-6">
      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] p-[22px] md:grid md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] md:items-center md:gap-14 md:rounded-[28px] md:p-16"
        )}
        style={{
          background: dark
            ? "radial-gradient(120% 120% at 85% 0%, #2A2E1C 0%, #14160C 55%, #0B0C06 100%)"
            : "radial-gradient(130% 130% at 90% 0%, #BADD4D 0%, #A8CD2F 55%, #9CC12A 100%)",
        }}
      >
        {dark && (
          <div className="pointer-events-none absolute -top-36 right-[6%] hidden size-[460px] rounded-full md:block" style={{ background: "radial-gradient(circle, rgba(168,205,47,.2) 0%, rgba(168,205,47,0) 70%)" }} />
        )}
        <div className="relative">
          <VerifiedBadge label={copy.badge} tone={dark ? "dark" : "lime"} />
          <h1 className={cn("mt-3.5 font-display text-[33px] font-extrabold leading-[1.05] tracking-[-0.02em] md:mt-[22px] md:text-[clamp(44px,4.6vw,64px)] md:leading-[1.02] md:tracking-[-0.022em]", dark ? "text-white" : "text-ink")}>
            <span className="md:hidden">
              {copy.titleLine1} <em className={cn("italic", dark && "text-brand-glow")}>{copy.titleLine2}</em>
            </span>
            <span className="hidden md:inline">
              {copy.titleLine1}
              <br />
              <em className={cn("italic", dark && "text-brand-glow")}>{copy.titleLine2}</em>
            </span>
          </h1>
          <p className={cn("mt-2.5 text-[13.5px] leading-[1.55] md:mt-5 md:max-w-[460px] md:text-[17px] md:leading-[1.65]", dark ? "text-[#A9AC9F]" : "text-ink/[0.78]")}>
            {copy.subtitle}
          </p>
          <div className="mt-4 flex flex-col gap-3.5 md:mt-[30px] md:flex-row md:flex-wrap md:items-center">
            <PrimaryCta text={copy.primaryCtaText} to={copy.primaryCtaLink} tone={dark ? "lime" : "lime-ink"} />
            <SecondaryCta text={copy.secondaryCtaText} to={copy.secondaryCtaLink} tone={dark ? "dark" : "lime"} />
          </div>
          <div className={cn("mt-2.5 text-center text-[11px] font-medium md:mt-[26px] md:text-left md:text-[13px]", dark ? "text-white/55" : "text-ink/60")}>
            {copy.footnote}
          </div>
        </div>
        <div className="relative mt-4 h-[170px] md:mt-0 md:h-[440px]">
          <HeroImage image={image} radius="rounded-[16px] md:rounded-[24px]" />
          <div className="hidden md:block">
            <HighlightCard card={highlightCard} tone={tone} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoHero({ image, copy }) {
  return (
    <div className="mx-auto mt-3 max-w-[1360px] px-4 md:mt-0 md:px-10 md:pt-6">
      <div className="relative h-[440px] overflow-hidden rounded-[24px] md:h-[520px] md:rounded-[28px]">
        <HeroImage image={image} radius="rounded-none" className="rounded-none" />
        <div className="pointer-events-none absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(10,11,5,.05) 25%, rgba(10,11,5,.85) 100%)" }} />
        <div className="pointer-events-none absolute inset-0 hidden md:block" style={{ background: "linear-gradient(75deg, rgba(10,11,5,.82) 0%, rgba(10,11,5,.42) 48%, rgba(10,11,5,.02) 78%)" }} />
        <div className="pointer-events-none absolute right-6 top-6 hidden rounded-full border border-white/18 bg-[rgba(13,15,7,0.6)] px-[18px] py-[9px] text-[12.5px] font-semibold text-white [backdrop-filter:blur(16px)] md:block">
          {copy.footnote}
        </div>
        <div className="pointer-events-none absolute inset-x-[18px] bottom-[18px] md:inset-x-auto md:bottom-[52px] md:left-14 md:max-w-[600px]">
          <VerifiedBadge label={copy.badge} tone="glass" />
          <h1 className="mt-3 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white md:mt-[18px] md:text-[clamp(42px,4.2vw,58px)] md:leading-[1.04] md:tracking-[-0.022em]">
            <span className="md:hidden">
              {copy.titleLine1} {copy.titleLine2}
            </span>
            <span className="hidden md:inline">
              {copy.titleLine1}
              <br />
              {copy.titleLine2}
            </span>
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-white/85 md:mt-3.5 md:max-w-[460px] md:text-[16.5px] md:leading-[1.6]">
            {copy.subtitle}
          </p>
          <div className="pointer-events-auto mt-3.5 flex flex-col gap-3.5 md:mt-6 md:flex-row md:items-center">
            <PrimaryCta text={copy.primaryCtaText} to={copy.primaryCtaLink} tone="lime" />
            <Link to={copy.secondaryCtaLink} className="hidden items-center gap-2 rounded-full border border-white/28 bg-white/14 px-[26px] py-[14px] text-[15px] font-semibold text-white [backdrop-filter:blur(16px)] transition-colors hover:border-white md:inline-flex">
              {copy.secondaryCtaText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Renders nothing but reserved space until the variant is actually known.
 *
 * The variants are DIFFERENT components at different heights (PanelHero
 * 170/440px, PhotoHero 440/520px), so defaulting an unknown variant to lime
 * meant a merchant on photo-fullbleed watched the wrong hero paint and then
 * get replaced — a component swap plus an 80px layout shift. Unknown is its
 * own state now. In practice this is rarely seen: the homepage ships its
 * settings inline (see settingsBootstrap.js), so `variant` is known on the
 * very first render. */
function HeroSkeleton() {
  // Same wrapper the real heroes hand-roll, so swapping in costs no shift.
  return (
    <div className="mx-auto mt-3 max-w-[1360px] px-4 md:mt-0 md:px-10 md:pt-6">
      <div className="h-[440px] animate-pulse rounded-[24px] bg-line-soft md:h-[520px] md:rounded-[28px]" />
    </div>
  );
}

export function HeroSection({ variant, image, highlightCard, content }) {
  if (!variant) return <HeroSkeleton />;
  const copy = resolveCopy(variant, content);
  if (variant === "dark-spotlight") return <PanelHero image={image} highlightCard={highlightCard} tone="dark" copy={copy} />;
  if (variant === "photo-fullbleed") return <PhotoHero image={image} copy={copy} />;
  return <PanelHero image={image} highlightCard={highlightCard} tone="lime" copy={copy} />;
}
