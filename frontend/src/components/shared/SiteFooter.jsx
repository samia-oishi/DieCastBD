import { Link } from "react-router";

import { Container } from "@/components/shared/Container";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/shared/SocialIcons";
import { NewsletterForm } from "@/features/newsletter/components/NewsletterForm";
import { useSettings } from "@/features/settings/api/useSettings";
import { ROUTES } from "@/constants/routes";

const DEFAULT_FOOTER_TEXT = "Premium diecast for serious collectors in Bangladesh.";
const DEFAULT_HELP_LINKS = [
  { url: ROUTES.ABOUT, label: "About" },
  { url: ROUTES.CONTACT, label: "Contact" },
  { url: ROUTES.FAQ, label: "FAQ" },
];
const POLICY_ROUTES = new Set([ROUTES.SHIPPING_POLICY, ROUTES.REFUND_POLICY, ROUTES.PRIVACY, ROUTES.TERMS]);
const DEFAULT_POLICY_LINKS = [
  { url: ROUTES.SHIPPING_POLICY, label: "Shipping Policy" },
  { url: ROUTES.REFUND_POLICY, label: "Refund Policy" },
  { url: ROUTES.PRIVACY, label: "Privacy Policy" },
  { url: ROUTES.TERMS, label: "Terms & Conditions" },
];
const PAYMENT_METHODS = ["COD", "bKash", "BanglaQR"];

function FooterLink({ label, url, className }) {
  if (/^https?:\/\//.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={url} className={className}>
      {label}
    </Link>
  );
}

function SocialRow({ social, size = "size-9" }) {
  if (!social.facebook && !social.instagram && !social.whatsapp) return null;
  const iconClass = size === "size-9" ? "size-3.75" : "size-3.5";
  return (
    <div className="flex gap-2">
      {social.facebook && (
        <a
          href={social.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className={`flex ${size} items-center justify-center rounded-full border border-white/18 text-[#DDDFD2] transition-colors hover:border-brand hover:text-brand`}
        >
          <FacebookIcon className={iconClass} />
        </a>
      )}
      {social.instagram && (
        <a
          href={social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className={`flex ${size} items-center justify-center rounded-full border border-white/18 text-[#DDDFD2] transition-colors hover:border-brand hover:text-brand`}
        >
          <InstagramIcon className={iconClass} />
        </a>
      )}
      {social.whatsapp && (
        <a
          href={social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className={`flex ${size} items-center justify-center rounded-full border border-white/18 text-[#DDDFD2] transition-colors hover:border-brand hover:text-brand`}
        >
          <WhatsAppIcon className={iconClass} />
        </a>
      )}
    </div>
  );
}

function Wordmark({ className }) {
  return (
    <div className={`font-display font-extrabold italic tracking-[-0.01em] ${className}`}>
      <span className="text-white">DIECAST</span>
      <span className="text-brand">BD</span>
    </div>
  );
}

/** Dark footer, two variants per AI_INSTRUCTIONS Phase 2: "big" (landing/shop/PDP —
 * full column grid + newsletter + ghost watermark) and "slim" (every other route —
 * one-row wordmark + links + social + copyright, desktop only; utility pages on
 * mobile rely on the bottom nav instead, matching every *.dc.html reference that
 * has no mobile footer at all). PublicLayout picks the variant per route. */
export function SiteFooter({ variant = "big" }) {
  const { data: settings } = useSettings();
  const social = settings?.socialLinks ?? {};
  const footerText = settings?.navigation?.footerText || DEFAULT_FOOTER_TEXT;
  const shopLinks = settings?.navigation?.headerLinks?.length
    ? settings.navigation.headerLinks
    : [{ label: "Shop", url: ROUTES.SHOP }];
  const allFooterLinks = settings?.navigation?.footerLinks?.length
    ? settings.navigation.footerLinks
    : [...DEFAULT_HELP_LINKS, ...DEFAULT_POLICY_LINKS];
  const helpLinks = allFooterLinks.filter((l) => !POLICY_ROUTES.has(l.url));
  const policyLinks = allFooterLinks.filter((l) => POLICY_ROUTES.has(l.url));
  const year = new Date().getFullYear();

  if (variant === "slim") {
    return (
      <footer className="hidden bg-ink text-[#8A8D80] md:block">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-6.5">
          <Wordmark className="text-[17px]" />
          <nav className="flex flex-wrap gap-4.5 text-[12.5px]">
            {helpLinks.map((link) => (
              <FooterLink key={link.url} {...link} className="text-[#C7C9BC] hover:text-white" />
            ))}
            {policyLinks.map((link) => (
              <FooterLink key={link.url} {...link} className="text-[#C7C9BC] hover:text-white" />
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <SocialRow social={social} size="size-7.5" />
            <span className="text-xs">
              © {year} DiecastBD
            </span>
          </div>
        </Container>
      </footer>
    );
  }

  return (
    <footer className="mt-7 text-[#C7C9BC] md:mt-22">
      {/* Desktop */}
      <div className="hidden bg-ink md:block">
        <Container className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-11 pt-15">
          <div>
            <Wordmark className="text-[23px]" />
            <p className="mt-3.5 max-w-70 text-sm leading-relaxed text-[#A9AC9F]">{footerText}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <span key={method} className="rounded-full border border-white/18 px-3.5 py-1.5 text-xs font-semibold text-[#DDDFD2]">
                  {method}
                </span>
              ))}
            </div>
            <div className="mt-4.5">
              <SocialRow social={social} />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[.12em] text-faint">SHOP</div>
            <div className="mt-4 flex flex-col gap-2.5 text-[13.5px]">
              {shopLinks.map((link) => (
                <FooterLink key={link.url} {...link} className="text-[#C7C9BC] hover:text-white" />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[.12em] text-faint">HELP</div>
            <div className="mt-4 flex flex-col gap-2.5 text-[13.5px]">
              {helpLinks.map((link) => (
                <FooterLink key={link.url} {...link} className="text-[#C7C9BC] hover:text-white" />
              ))}
            </div>
          </div>
          <div>
            <div className="text-[15px] font-bold text-white">The drop list</div>
            <p className="mt-2 text-[13px] text-[#A9AC9F]">New arrivals and restocks, straight to your inbox. No spam.</p>
            <div className="mt-4">
              <NewsletterForm variant="footer" />
            </div>
          </div>
        </Container>
        <Container className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-5 text-[12.5px] text-faint">
            <span>© {year} DiecastBD. All rights reserved.</span>
            <nav className="flex flex-wrap gap-5.5">
              {policyLinks.map((link) => (
                <FooterLink key={link.url} {...link} className="text-faint hover:text-white" />
              ))}
            </nav>
          </div>
        </Container>
        <div className="relative h-35 overflow-hidden">
          <div className="absolute left-1/2 -bottom-14.5 -translate-x-1/2 font-display text-[clamp(90px,12vw,176px)] leading-none font-extrabold whitespace-nowrap text-white/[.045] italic">
            DIECASTBD
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="rounded-t-3xl bg-ink px-5 pt-7 pb-26 md:hidden">
        <Wordmark className="text-xl" />
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#A9AC9F]">{footerText}</p>
        <div className="mt-4.5">
          <NewsletterForm variant="footer" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <div className="text-[10.5px] font-bold tracking-[.12em] text-faint">SHOP</div>
            <div className="mt-3 flex flex-col gap-2.5 text-[12.5px]">
              {shopLinks.map((link) => (
                <FooterLink key={link.url} {...link} className="text-[#C7C9BC]" />
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-bold tracking-[.12em] text-faint">HELP</div>
            <div className="mt-3 flex flex-col gap-2.5 text-[12.5px]">
              {helpLinks.map((link) => (
                <FooterLink key={link.url} {...link} className="text-[#C7C9BC]" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => (
            <span key={method} className="rounded-full border border-white/18 px-3 py-1 text-[11px] font-semibold text-[#DDDFD2]">
              {method}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <SocialRow social={social} size="size-8" />
        </div>
        <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {policyLinks.map((link) => (
            <FooterLink key={link.url} {...link} className="text-[#C7C9BC]" />
          ))}
        </nav>
        <div className="mt-4 border-t border-white/10 pt-3.5 text-[11px] text-faint">© {year} DiecastBD. All rights reserved.</div>
      </div>
    </footer>
  );
}
