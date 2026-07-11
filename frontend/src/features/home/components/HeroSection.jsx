import { Link } from "react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { formatTaka } from "@/lib/currency";
import { cn } from "@/lib/utils";

// Per-variant design copy. Content is the design's (the live heroBanner text is
// partially corrupted); the real uploaded hero image is still used. Hero text
// editability is tracked in the Phase 9 customizability backlog.
const NEW_ARRIVALS_HREF = ROUTES.SHOP;
const EXPLORE_HREF = ROUTES.SHOP;

function HeroImage({ image, className, radius = "rounded-[16px] md:rounded-[24px]" }) {
  if (image?.url) {
    return <img src={image.url} alt="" className={cn("size-full object-cover", radius, className)} />;
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

function VerifiedBadge({ tone }) {
  const styles = {
    lime: "bg-white/35 text-[#1C2108]",
    dark: "border border-white/14 bg-white/[0.08] text-brand-glow",
    glass: "border border-white/22 bg-white/14 text-white [backdrop-filter:blur(16px)]",
  };
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold md:px-4 md:text-[12.5px]", styles[tone])}>
      <ShieldCheck size={13} strokeWidth={2} className={tone === "glass" ? "text-brand-glow" : undefined} />
      <span className="md:hidden">Hand-verified authentic</span>
      <span className="hidden md:inline">{tone === "glass" ? "Hand-verified authentic" : "Every piece hand-verified"}</span>
    </div>
  );
}

function PrimaryCta({ tone }) {
  const styles = tone === "lime-ink"
    ? "bg-ink text-white hover:bg-[#2A2E1C]"
    : "bg-brand text-ink hover:bg-brand-bright";
  return (
    <Link
      to={EXPLORE_HREF}
      className={cn("inline-flex h-[50px] items-center justify-center gap-2.5 rounded-full px-7 text-[14.5px] font-bold transition-colors md:h-auto md:py-[15px] md:text-[15px]", styles)}
    >
      Explore the collection <ArrowRight size={16} strokeWidth={2} />
    </Link>
  );
}

function SecondaryCta({ tone }) {
  const styles = {
    lime: "border-[1.5px] border-black/30 text-ink hover:border-ink hover:bg-white/25",
    dark: "border-[1.5px] border-white/28 text-white hover:border-white",
  };
  return (
    <Link to={NEW_ARRIVALS_HREF} className={cn("hidden items-center gap-2 rounded-full px-[26px] py-[14px] text-[15px] font-semibold transition-colors md:inline-flex", styles[tone])}>
      New arrivals
    </Link>
  );
}

function PanelHero({ image, highlightCard, tone }) {
  const dark = tone === "dark";
  const title = dark ? { a: "Real metal.", b: "Zero fakes." } : { a: "Own the", b: "original." };
  const subMobile = "Verified Hot Wheels Premium & MINI GT — delivered nationwide.";
  const subDesktop = dark
    ? "Hot Wheels Premium and MINI GT 1:64 under studio lights — sourced direct, inspected piece by piece, delivered nationwide."
    : "Hot Wheels Premium and MINI GT 1:64 — sourced direct, inspected piece by piece, and packed the way we'd pack our own.";

  return (
    <div className="mx-auto mt-3 max-w-[1440px] px-4 md:mt-0 md:px-10 md:pt-6">
      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] p-[22px] md:grid md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] md:items-center md:gap-14 md:rounded-[28px]",
          dark ? "md:p-[72px_64px]" : "md:p-16"
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
          <VerifiedBadge tone={dark ? "dark" : "lime"} />
          <h1 className={cn("mt-3.5 font-display text-[33px] font-extrabold leading-[1.05] tracking-[-0.02em] md:mt-[22px] md:text-[clamp(44px,4.6vw,64px)] md:leading-[1.02] md:tracking-[-0.022em]", dark ? "text-white" : "text-ink")}>
            <span className="md:hidden">
              {title.a} <em className={cn("italic", dark && "text-brand-glow")}>{title.b}</em>
            </span>
            <span className="hidden md:inline">
              {title.a}
              <br />
              <em className={cn("italic", dark && "text-brand-glow")}>{title.b}</em>
            </span>
          </h1>
          <p className={cn("mt-2.5 text-[13.5px] leading-[1.55] md:mt-5 md:max-w-[460px] md:text-[17px] md:leading-[1.65]", dark ? "text-[#A9AC9F]" : "text-ink/[0.78]")}>
            <span className="md:hidden">{subMobile}</span>
            <span className="hidden md:inline">{subDesktop}</span>
          </p>
          <div className="mt-4 flex flex-col gap-3.5 md:mt-[30px] md:flex-row md:flex-wrap md:items-center">
            <PrimaryCta tone={dark ? "lime" : "lime-ink"} />
            <SecondaryCta tone={dark ? "dark" : "lime"} />
          </div>
          <div className={cn("mt-2.5 text-center text-[11px] font-medium md:mt-[26px] md:text-left md:text-[13px]", dark ? "text-white/55" : "text-ink/60")}>
            <span className="md:hidden">COD · bKash · BanglaQR</span>
            <span className="hidden md:inline">Cash on delivery · bKash · BanglaQR — delivered nationwide</span>
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

function PhotoHero({ image }) {
  return (
    <div className="mx-auto mt-3 max-w-[1440px] px-4 md:mt-0 md:px-10 md:pt-6">
      <div className="relative h-[440px] overflow-hidden rounded-[24px] md:h-[560px] md:rounded-[28px]">
        <HeroImage image={image} radius="rounded-none" className="rounded-none" />
        <div className="pointer-events-none absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(10,11,5,.05) 25%, rgba(10,11,5,.85) 100%)" }} />
        <div className="pointer-events-none absolute inset-0 hidden md:block" style={{ background: "linear-gradient(75deg, rgba(10,11,5,.82) 0%, rgba(10,11,5,.42) 48%, rgba(10,11,5,.02) 78%)" }} />
        <div className="pointer-events-none absolute right-6 top-6 hidden rounded-full border border-white/18 bg-[rgba(13,15,7,0.6)] px-[18px] py-[9px] text-[12.5px] font-semibold text-white [backdrop-filter:blur(16px)] md:block">
          COD · bKash · BanglaQR
        </div>
        <div className="pointer-events-none absolute inset-x-[18px] bottom-[18px] md:inset-x-auto md:bottom-[52px] md:left-14 md:max-w-[600px]">
          <VerifiedBadge tone="glass" />
          <h1 className="mt-3 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white md:mt-[18px] md:text-[clamp(42px,4.2vw,58px)] md:leading-[1.04] md:tracking-[-0.022em]">
            Authenticity,<br />cast in metal.
          </h1>
          <p className="mt-2 text-[13px] leading-[1.55] text-white/85 md:mt-3.5 md:max-w-[460px] md:text-[16.5px] md:leading-[1.6]">
            <span className="md:hidden">Verified Hot Wheels Premium &amp; MINI GT — one batch, gone for good.</span>
            <span className="hidden md:inline">Verified Hot Wheels Premium &amp; MINI GT — one import batch, gone for good.</span>
          </p>
          <div className="pointer-events-auto mt-3.5 flex flex-col gap-3.5 md:mt-6 md:flex-row md:items-center">
            <PrimaryCta tone="lime" />
            <Link to={NEW_ARRIVALS_HREF} className="hidden items-center gap-2 rounded-full border border-white/28 bg-white/14 px-[26px] py-[14px] text-[15px] font-semibold text-white [backdrop-filter:blur(16px)] transition-colors hover:border-white md:inline-flex">
              New arrivals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ variant = "lime-showroom", image, highlightCard }) {
  if (variant === "dark-spotlight") return <PanelHero image={image} highlightCard={highlightCard} tone="dark" />;
  if (variant === "photo-fullbleed") return <PhotoHero image={image} />;
  return <PanelHero image={image} highlightCard={highlightCard} tone="lime" />;
}
