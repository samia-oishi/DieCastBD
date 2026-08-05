import { Link } from "react-router";
import { ShieldCheck, Package, Truck, Sparkles, CarFront, ArrowRight } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { SeoHead } from "@/components/shared/Seo";
import { SITE_URL } from "@/lib/siteUrl";
import { buildStaticPage } from "@/lib/seo/routes";
import { useSettings } from "@/features/settings/api/useSettings";

const WHY = [
  { icon: ShieldCheck, title: "100% authentic", desc: "Sourced direct and verified before it reaches you — no replicas, ever." },
  { icon: Package, title: "Collector-grade packaging", desc: "Cards and boxes protected in transit — what you see online is what arrives." },
  { icon: Truck, title: "Nationwide delivery", desc: "Delivered securely across Bangladesh, tracked from dispatch to doorstep." },
  { icon: Sparkles, title: "Curated, not crowded", desc: "We list what's genuinely worth collecting — not a warehouse dump." },
];

export function AboutPage() {
  const { data: settings } = useSettings();

  return (
    <>
      <SeoHead model={buildStaticPage({ key: "about", settings, siteUrl: SITE_URL })} />
      <div className="mx-auto w-full max-w-[1160px] px-4 pb-12 pt-9 md:px-6 md:pt-14">
        {/* hero statement */}
        <div className="max-w-[760px]">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-deep">About DiecastBD</div>
          <h1 className="mt-3.5 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink md:text-[clamp(34px,5vw,54px)]">
            Collectors first.<br /><em className="italic">Always.</em>
          </h1>
          <p className="mt-5 text-[17px] leading-[1.7] text-ink-soft">
            DiecastBD brings premium 1:64 to Bangladesh — starting with Hot Wheels Premium and MINI GT, with more collector-grade brands to follow. We built it because collectors here deserve the same access, authenticity, and care collectors anywhere else expect.
          </p>
        </div>

        {/* story + image */}
        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
          <div className="flex flex-col justify-center rounded-[24px] bg-ink p-9">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand">The collector promise</div>
            <div className="mt-3.5 font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.015em] text-white md:text-[clamp(22px,2.4vw,30px)]">
              If it wouldn't go on our shelf, it doesn't go on yours.
            </div>
            <p className="mt-4 text-[14.5px] leading-[1.7] text-[#A9AC9F]">
              Every model we list is inspected, authenticated, and packaged the way a collector would want to receive it — because we're collectors too. We see more than a toy car; we know you do too.
            </p>
          </div>
          <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-[24px] bg-tile">
            <CarFront className="size-16 text-faint/40" strokeWidth={1} />
          </div>
        </div>

        {/* why collectors choose us */}
        <div className="mt-14">
          <h2 className="font-display text-[28px] font-bold tracking-[-0.01em] text-ink">Why collectors choose us</h2>
          <div className="mt-[22px] grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-[20px] border border-line bg-white p-[22px]">
                <div className="flex size-[42px] items-center justify-center rounded-full bg-[#EFF5DC] text-brand-deep">
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <div className="mt-3 text-[15px] font-bold text-ink">{title}</div>
                <div className="mt-1 text-[13px] leading-[1.55] text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-[24px] p-9"
          style={{ background: "radial-gradient(120% 140% at 85% 0%, #BADD4D 0%, #A8CD2F 55%, #9CC12A 100%)" }}
        >
          <div>
            <div className="font-display text-[22px] font-extrabold tracking-[-0.015em] text-ink md:text-[clamp(22px,2.6vw,28px)]">Start your shelf today.</div>
            <div className="mt-1.5 text-sm text-ink/70">Verified collector pieces in stock — COD, bKash or BanglaQR.</div>
          </div>
          <Link to={ROUTES.SHOP} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2A2E1C]">
            Browse the collection <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </>
  );
}
