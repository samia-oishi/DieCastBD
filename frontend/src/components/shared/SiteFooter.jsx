import { Link } from "react-router";

import { ROUTES } from "@/constants/routes";
import { useSettings } from "@/features/settings/api/useSettings";
import { NewsletterForm } from "@/features/newsletter/components/NewsletterForm";
import { FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/shared/SocialIcons";

const DEFAULT_FOOTER_TEXT = "Premium diecast for serious collectors in Bangladesh.";
const POLICY_ROUTES = new Set([ROUTES.SHIPPING_POLICY, ROUTES.REFUND_POLICY, ROUTES.PRIVACY, ROUTES.TERMS]);

const DEFAULT_SHOP_LINKS = [
  { label: "New arrivals", url: ROUTES.SHOP },
  { label: "Hot Wheels Premium", url: "/shop?brand=hot-wheels-premium" },
  { label: "MINI GT", url: "/shop?brand=mini-gt" },
  { label: "Accessories", url: "/shop?category=accessories" },
];
const DEFAULT_HELP_LINKS = [
  { label: "About", url: ROUTES.ABOUT },
  { label: "Contact", url: ROUTES.CONTACT },
  { label: "FAQ", url: ROUTES.FAQ },
];
const DEFAULT_POLICY_LINKS = [
  { label: "Shipping Policy", url: ROUTES.SHIPPING_POLICY },
  { label: "Refund Policy", url: ROUTES.REFUND_POLICY },
  { label: "Privacy Policy", url: ROUTES.PRIVACY },
  { label: "Terms & Conditions", url: ROUTES.TERMS },
];

const SOCIAL_DEFAULTS = {
  facebook: "https://www.facebook.com/diecastbd.official",
  instagram: "https://www.instagram.com/diecastbd.official",
  youtube: "https://www.youtube.com/@diecastbd",
};

const PAYMENTS = ["COD", "bKash", "BanglaQR"];

function useFooterData() {
  const { data: settings } = useSettings();
  const nav = settings?.navigation;
  const shopLinks = nav?.headerLinks?.length ? nav.headerLinks : DEFAULT_SHOP_LINKS;
  const footerLinks = nav?.footerLinks?.length ? nav.footerLinks : [...DEFAULT_HELP_LINKS, ...DEFAULT_POLICY_LINKS];
  const helpLinks = footerLinks.filter((l) => !POLICY_ROUTES.has(l.url));
  const policyLinks = footerLinks.filter((l) => POLICY_ROUTES.has(l.url));
  const social = settings?.socialLinks || {};
  return {
    tagline: nav?.footerText || DEFAULT_FOOTER_TEXT,
    shopLinks,
    helpLinks: helpLinks.length ? helpLinks : DEFAULT_HELP_LINKS,
    policyLinks: policyLinks.length ? policyLinks : DEFAULT_POLICY_LINKS,
    social: {
      facebook: social.facebook || SOCIAL_DEFAULTS.facebook,
      instagram: social.instagram || SOCIAL_DEFAULTS.instagram,
      youtube: SOCIAL_DEFAULTS.youtube,
    },
  };
}

function Wordmark({ size }) {
  return (
    <div className="font-display font-extrabold italic tracking-[-0.01em]" style={{ fontSize: size }}>
      <span className="text-white">DIECAST</span>
      <span className="text-brand">BD</span>
    </div>
  );
}

function PaymentPills({ pad = "6px 14px", size = "12px" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PAYMENTS.map((p) => (
        <span
          key={p}
          className="rounded-full border border-white/18 font-semibold text-[#DDDFD2]"
          style={{ padding: pad, fontSize: size }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

function Socials({ social, size = 36, icon = 15 }) {
  const items = [
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social.youtube, label: "YouTube", Icon: YouTubeIcon },
  ];
  return (
    <div className="flex gap-2.5">
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex items-center justify-center rounded-full border border-white/18 text-[#DDDFD2] transition-colors hover:border-brand hover:text-brand"
          style={{ width: size, height: size }}
        >
          <Icon width={icon} height={icon} />
        </a>
      ))}
    </div>
  );
}

function ColumnLabel({ children }) {
  return <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#8A8D80] md:text-xs">{children}</div>;
}

function FooterLink({ link }) {
  if (/^https?:\/\//.test(link.url)) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#C7C9BC] hover:text-white">
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.url} className="text-[#C7C9BC] hover:text-white">
      {link.label}
    </Link>
  );
}

function BigFooter() {
  const { tagline, shopLinks, helpLinks, policyLinks, social } = useFooterData();

  return (
    <footer className="bg-ink text-[#C7C9BC]">
      {/* Mobile */}
      <div className="rounded-t-[24px] px-5 pb-[104px] pt-7 md:hidden">
        <Wordmark size={20} />
        <p className="mt-2.5 text-[12.5px] leading-[1.6] text-[#A9AC9F]">{tagline}</p>
        <NewsletterForm variant="footer" />
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <ColumnLabel>SHOP</ColumnLabel>
            <div className="mt-3 flex flex-col gap-2.5 text-[12.5px]">
              {shopLinks.map((l) => <FooterLink key={l.label} link={l} />)}
            </div>
          </div>
          <div>
            <ColumnLabel>HELP</ColumnLabel>
            <div className="mt-3 flex flex-col gap-2.5 text-[12.5px]">
              {helpLinks.map((l) => <FooterLink key={l.label} link={l} />)}
            </div>
          </div>
        </div>
        <div className="mt-5"><PaymentPills pad="5px 12px" size="11px" /></div>
        <div className="mt-4"><Socials social={social} size={32} icon={14} /></div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {policyLinks.map((l) => <FooterLink key={l.label} link={l} />)}
        </div>
        <div className="mt-4 border-t border-white/10 pt-3.5 text-[11px] text-[#8A8D80]">© 2026 DiecastBD. All rights reserved.</div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="mx-auto grid max-w-[1360px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-11 px-10 pt-[60px]">
          <div>
            <Wordmark size={23} />
            <p className="mt-3.5 max-w-[280px] text-sm leading-[1.6] text-[#A9AC9F]">{tagline}</p>
            <div className="mt-5"><PaymentPills /></div>
            <div className="mt-[18px]"><Socials social={social} /></div>
          </div>
          <div>
            <ColumnLabel>SHOP</ColumnLabel>
            <div className="mt-4 flex flex-col gap-[11px] text-[13.5px]">
              {shopLinks.map((l) => <FooterLink key={l.label} link={l} />)}
            </div>
          </div>
          <div>
            <ColumnLabel>HELP</ColumnLabel>
            <div className="mt-4 flex flex-col gap-[11px] text-[13.5px]">
              {helpLinks.map((l) => <FooterLink key={l.label} link={l} />)}
            </div>
          </div>
          <div>
            <div className="text-[15px] font-bold text-white">The drop list</div>
            <p className="mt-2 text-[13px] text-[#A9AC9F]">New arrivals and restocks, straight to your inbox. No spam.</p>
            <NewsletterForm variant="footer" />
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-[1360px] px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-5 text-[12.5px] text-[#8A8D80]">
            <span>© 2026 DiecastBD. All rights reserved.</span>
            <span className="flex flex-wrap gap-[22px]">
              {policyLinks.map((l) => (
                <span key={l.label} className="[&_a]:!text-[#8A8D80] [&_a:hover]:!text-white">
                  <FooterLink link={l} />
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="relative h-[140px] overflow-hidden">
          <div className="absolute bottom-[-58px] left-1/2 -translate-x-1/2 whitespace-nowrap font-display font-extrabold italic leading-none text-white/[0.045]" style={{ fontSize: "clamp(90px,12vw,176px)" }}>
            DIECASTBD
          </div>
        </div>
      </div>
    </footer>
  );
}

function SlimFooter() {
  const { policyLinks } = useFooterData();
  // Utility pages: single desktop-only row; mobile relies on the bottom nav.
  return (
    <footer className="hidden bg-ink text-[#8A8D80] md:block">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-10 py-6 text-[12.5px]">
        <span>© 2026 DiecastBD. All rights reserved.</span>
        <span className="flex flex-wrap gap-[22px]">
          {policyLinks.map((l) => (
            <span key={l.label} className="[&_a]:!text-[#8A8D80] [&_a:hover]:!text-white">
              <FooterLink link={l} />
            </span>
          ))}
        </span>
      </div>
    </footer>
  );
}

export function SiteFooter({ variant = "big" }) {
  return variant === "slim" ? <SlimFooter /> : <BigFooter />;
}
