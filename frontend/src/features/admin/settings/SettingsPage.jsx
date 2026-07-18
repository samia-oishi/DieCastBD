import { createContext, useContext, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Plus, Trash2, ImageUp, ChevronDown, Sparkles, Megaphone, LayoutGrid, Star, ShieldCheck,
  Quote, HelpCircle, AtSign, Truck, CreditCard, Link2, Search, Image as ImageIcon, QrCode,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { adminInputCls, adminTextareaCls } from "@/features/admin/shell/adminFieldCls";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { SaveBar } from "@/features/admin/shell/SaveBar";
import { adminToast } from "@/features/admin/shell/adminToast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { ICON_MAP } from "@/components/shared/settingsIcons";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts } from "@/features/products/api/useProducts";
import { useUpdateSettingsMutation, useUploadSettingsImageMutation } from "./api/useAdminSettings";

const ICON_NAMES = Object.keys(ICON_MAP);

/* ------------------------------------------------------------------ */
/* Prototype building blocks — every visual constant below is read     */
/* straight from Admin Settings.dc.html, not approximated.             */
/* ------------------------------------------------------------------ */

// Which rail item a card belongs to. Cards read it from context rather than
// each call site wrapping itself in a conditional — some rail items (Payments,
// Announcement bar, Trust & promise) own more than one card.
const ActiveSectionContext = createContext(null);

/** Section card: white, border-line, radius 18, 22px pad. H2 is Archivo 700
 * 17px with the 13px description under it; `action` sits on the header's right
 * (the design puts "Show hero" there). `heading` replaces the plain h2 when a
 * card needs a decorated title (the bKash tile). */
function Card({ section, title, heading, description, action, children }) {
  const active = useContext(ActiveSectionContext);
  if (section && active !== section) return null;
  return (
    <section className="rounded-[18px] border border-line bg-white p-[22px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {heading ?? <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-ink">{title}</h2>}
          {description && <p className="mt-1 text-[13px] leading-[1.5] text-[#6B6E60]">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center pt-0.5">{action}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Field label, 12.5px/600 with 6px under it. */
function L({ children, hint }) {
  return (
    <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">
      {children}
      {hint && <span className="font-normal text-faint"> {hint}</span>}
    </span>
  );
}

/** The design's 40×24 toggle — lime when on, #DEDFD6 off, 18px knob. */
function Toggle({ control, name, label }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <button
          type="button"
          role="switch"
          aria-checked={!!field.value}
          aria-label={label}
          onClick={() => field.onChange(!field.value)}
          className="box-border h-6 w-10 shrink-0 cursor-pointer rounded-full border-none p-[3px] transition-colors duration-200"
          style={{ background: field.value ? "#A8CD2F" : "#DEDFD6" }}
        >
          <span
            className="block size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(16,18,8,0.25)] transition-transform duration-200"
            style={{ transform: field.value ? "translateX(16px)" : "none" }}
          />
        </button>
      )}
    />
  );
}

function ToggleRow({ control, name, children, note }) {
  return (
    <span className="flex items-center gap-2.5 text-[13px] font-semibold text-ink">
      <Toggle control={control} name={name} label={typeof children === "string" ? children : undefined} />
      {children}
      {note && <span className="font-normal text-faint">{note}</span>}
    </span>
  );
}

/** Native select with the design's chevron — reactive `value` means no Radix
 * key-remount trick is needed for async-loaded settings (decision #46). */
function Sel({ className, children, ...props }) {
  return (
    <span className={cn("relative block", className)}>
      <select {...props} className={cn(adminInputCls, "cursor-pointer appearance-none pr-9")}>
        {children}
      </select>
      <ChevronDown size={15} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
    </span>
  );
}

/** 44×44 colour swatch + hex input pair, synced to one field. Blank stays
 * blank (the fallback renders as swatch/placeholder) rather than writing the
 * fallback into the form. */
function ColorPair({ control, name, fallback }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex gap-2">
          <input
            type="color"
            value={field.value || fallback}
            onChange={(e) => field.onChange(e.target.value)}
            className="box-border size-11 shrink-0 cursor-pointer rounded-[10px] border border-line bg-white p-[3px]"
          />
          <Input
            className={cn(adminInputCls, "min-w-0 flex-1")}
            placeholder={fallback}
            value={field.value || ""}
            onChange={(e) => field.onChange(e.target.value)}
          />
        </div>
      )}
    />
  );
}

/** Image tile + "Replace image" pill, per the design (56px tile, 38px pill).
 * Same Cloudinary mutation as before; only the clothes changed. */
function UploadTile({ control, name, size = 56, tile, emptyIcon: EmptyIcon = ImageIcon, replaceLabel = "Replace image", emptyText }) {
  const uploadMutation = useUploadSettingsImageMutation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-3">
          {field.value?.url ? (
            <img src={field.value.url} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-[12px] border border-line object-cover" />
          ) : (
            tile ?? (
              <div
                style={{ width: size, height: size }}
                className="flex shrink-0 items-center justify-center rounded-[12px] border border-line bg-white text-center text-[9.5px] font-semibold leading-[1.25] text-faint"
              >
                {emptyText ?? <EmptyIcon size={18} strokeWidth={1.8} className="text-ink" />}
              </div>
            )
          )}
          <label className="flex h-[38px] cursor-pointer items-center gap-[7px] rounded-full border border-line bg-white px-[15px] text-[12.5px] font-semibold text-ink transition-colors hover:border-ink">
            <ImageUp size={14} strokeWidth={1.8} />
            {uploadMutation.isPending ? "Uploading…" : field.value?.url ? replaceLabel : replaceLabel.replace("Replace", "Upload")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const uploaded = await uploadMutation.mutateAsync(file);
                  field.onChange(uploaded);
                } catch {
                  toast.error("Upload failed");
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
      )}
    />
  );
}

/* --------------------------- collapsed rows ------------------------ */

// One row open across the whole page, exactly like the prototype's single
// `open` key ("tl:0", "fq:2", …).
const OpenRowContext = createContext(["", () => {}]);

/** Collapsed row: white bordered container, header button, expand-to-edit. */
function Row({ id, header, children }) {
  const [openRow, setOpenRow] = useContext(OpenRowContext);
  const open = openRow === id;
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpenRow(open ? "" : id)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {header}
        <ChevronDown size={15} strokeWidth={2} className={cn("ml-auto shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="grid gap-3.5 border-t border-line-soft p-4">{children}</div>}
    </div>
  );
}

function AddRowButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[#DEDFD6] bg-transparent p-3 text-[13px] font-semibold text-ink-soft transition-colors hover:border-brand hover:text-ink"
    >
      <Plus size={14} strokeWidth={2.2} /> {children}
    </button>
  );
}

function RemoveRowButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold text-[#B3261E] transition-colors hover:bg-[#FDF6F5]"
    >
      <Trash2 size={13} strokeWidth={1.9} /> {children}
    </button>
  );
}

/* ----------------------------- rail -------------------------------- */

const SECTION_GROUPS = [
  {
    label: "Homepage",
    items: [
      { id: "hero", label: "Hero", icon: Sparkles },
      { id: "announcement", label: "Announcement bar", icon: Megaphone },
      { id: "sections", label: "Sections & shelf", icon: LayoutGrid },
      { id: "spotlight", label: "Featured spotlight", icon: Star },
      { id: "trust", label: "Trust & promise", icon: ShieldCheck },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "testimonials", label: "Testimonials", icon: Quote },
      { id: "faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  {
    label: "Store",
    items: [
      { id: "contact", label: "Contact & social", icon: AtSign },
      { id: "shipping", label: "Shipping", icon: Truck },
      { id: "payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Site",
    items: [
      { id: "navigation", label: "Navigation", icon: Link2 },
      { id: "seo", label: "SEO defaults", icon: Search },
    ],
  },
];

const ALL_ITEMS = SECTION_GROUPS.flatMap((g) => g.items);

/** True if anything in RHF's dirtyFields tree is actually dirty.
 *
 * The save bar can't use `isDirty` here. This form is fed by `values` (server
 * settings) alongside `defaultValues`, and after a save the refetch leaves
 * isDirty stuck true while dirtyFields is empty — so the bar never retracted.
 * dirtyFields is the honest signal: it empties when a field is edited back to
 * its saved value, which is exactly when the bar should go away.
 */
function hasDirtyFields(node) {
  if (node === true) return true;
  if (!node || typeof node !== "object") return false;
  return Object.values(node).some(hasDirtyFields);
}

/** Desktop rail — sticky card, hairline-divided groups, ink pill for active. */
function SettingsRail({ active, onChange }) {
  return (
    <nav className="w-[212px] shrink-0 overflow-hidden rounded-[18px] border border-line bg-white">
      {SECTION_GROUPS.map((group, i) => (
        <div key={group.label} className={cn("p-2.5", i > 0 && "border-t border-line-soft")}>
          <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.07em] text-faint">
            {group.label}
          </div>
          {group.items.map(({ id, label, icon: Icon }) => {
            const on = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-left text-[12.5px] font-semibold transition-colors",
                  on ? "bg-ink text-white" : "text-ink-soft hover:bg-tile"
                )}
              >
                <Icon size={14} strokeWidth={1.9} className={on ? "text-brand" : "text-faint"} />
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Mobile equivalent — a horizontal chip bar; there's no room for a rail. */
function SettingsChips({ active, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden">
      <div className="flex w-max gap-1.5">
        {ALL_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "h-8 shrink-0 rounded-full border px-3 text-[12px] font-semibold transition-colors",
              active === id ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- hero copy tabs -------------------------- */

// Per-variant hero copy editors. Placeholders show the shipped default that
// renders when a field is left blank, so admins can see what they're overriding
// (and clearing a field restores that default rather than blanking the hero).
const HERO_VARIANTS = [
  {
    key: "limeShowroom",
    label: "Lime showroom",
    ph: {
      badge: "Every piece hand-verified",
      titleLine1: "Own the",
      titleLine2: "original.",
      subtitle: "Hot Wheels Premium and MINI GT 1:64 — sourced direct, inspected piece by piece…",
      footnote: "Cash on delivery · bKash · BanglaQR — delivered nationwide",
    },
  },
  {
    key: "darkSpotlight",
    label: "Dark spotlight",
    ph: {
      badge: "Every piece hand-verified",
      titleLine1: "Real metal.",
      titleLine2: "Zero fakes.",
      subtitle: "Hot Wheels Premium and MINI GT 1:64 under studio lights — inspected piece by piece…",
      footnote: "Cash on delivery · bKash · BanglaQR — delivered nationwide",
    },
  },
  {
    key: "photoFullbleed",
    label: "Photo full-bleed",
    ph: {
      badge: "Hand-verified authentic",
      titleLine1: "Authenticity,",
      titleLine2: "cast in metal.",
      subtitle: "Verified Hot Wheels Premium & MINI GT — one import batch, gone for good.",
      footnote: "COD · bKash · BanglaQR",
    },
  },
];

function HeroVariantFields({ register, base, ph }) {
  return (
    <div className="grid gap-3.5">
      <div>
        <L>Badge</L>
        <Input className={adminInputCls} {...register(`${base}.badge`)} placeholder={ph.badge} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <div>
          <L>Title line 1</L>
          <Input className={adminInputCls} {...register(`${base}.titleLine1`)} placeholder={ph.titleLine1} />
        </div>
        <div>
          <L>Title line 2 (emphasized)</L>
          <Input className={adminInputCls} {...register(`${base}.titleLine2`)} placeholder={ph.titleLine2} />
        </div>
      </div>
      <div>
        <L>Subtitle</L>
        <Textarea className={adminTextareaCls} rows={2} {...register(`${base}.subtitle`)} placeholder={ph.subtitle} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <div>
          <L>Primary button text</L>
          <Input className={adminInputCls} {...register(`${base}.primaryCtaText`)} placeholder="Explore the collection" />
        </div>
        <div>
          <L>Primary button link</L>
          <Input className={adminInputCls} {...register(`${base}.primaryCtaLink`)} placeholder="/shop" />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <div>
          <L>Secondary button text</L>
          <Input className={adminInputCls} {...register(`${base}.secondaryCtaText`)} placeholder="New arrivals" />
        </div>
        <div>
          <L>Secondary button link</L>
          <Input className={adminInputCls} {...register(`${base}.secondaryCtaLink`)} placeholder="/shop" />
        </div>
      </div>
      <div>
        <L>Footnote</L>
        <Input className={adminInputCls} {...register(`${base}.footnote`)} placeholder={ph.footnote} />
      </div>
    </div>
  );
}

const HOMEPAGE_SECTIONS = [
  { key: "collectorPicks", label: "Collector Picks" },
  { key: "featuredProducts", label: "Featured Products" },
  { key: "brandsStrip", label: "Brands Strip" },
  { key: "newArrivals", label: "New Arrivals" },
  { key: "whyChooseUs", label: "Why Choose Us" },
  { key: "collectorPromise", label: "Collector Promise" },
  { key: "testimonials", label: "Testimonials" },
  { key: "instagramFeed", label: "Instagram" },
  { key: "newsletter", label: "Newsletter Signup" },
];

const SEPARATOR_CHARS = { dot: "·", pipe: "|", slash: "/", diamond: "◆", star: "✦", none: " " };

/* ============================== page =============================== */

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { data: productsResp } = useProducts({ limit: 100 });
  const productList = productsResp?.data ?? [];
  const updateMutation = useUpdateSettingsMutation();

  const [activeSection, setActiveSection] = useState("hero");
  const openRowState = useState("");
  const [, setOpenRow] = openRowState;
  const [heroTab, setHeroTab] = useState("limeShowroom");

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = useForm({
    values: settings,
    defaultValues: {
      // PATCH /admin/settings replaces the whole subtree, so every field must
      // exist here or it would be dropped on save.
      announcementBar: {
        bgColor: "",
        textColor: "",
        iconColor: "",
        separatorColor: "",
        separatorStyle: "dot",
        showOnAllPages: false,
        scrollSpeed: 20,
        desktop: { isActive: false, autoScroll: false, messages: [] },
        mobile: { isActive: false, autoScroll: false, messages: [] },
      },
      whyChooseUs: [],
      shopByShelf: [],
      shopByShelfHeading: "",
      shopByShelfSubtitle: "",
      featuredSpotlight: { productSlug: "", image: null, badge: "", brandLine: "", title: "", description: "" },
      collectorPromise: { title: "", description: "", image: null, bgColor: "", textColor: "", ctaText: "", ctaLink: "" },
      testimonials: [],
      socialLinks: { facebook: "", instagram: "", whatsapp: "", youtube: "" },
      contactInfo: { email: "", phone: "", address: "" },
      shippingZones: [],
      freeShippingThreshold: 0,
      bkashConfig: { merchantNumber: "", qrImage: null },
      banglaQrConfig: { accountInfo: "", qrImage: null },
      homepageSections: {
        hero: {
          enabled: true,
          image: null,
          variant: "photo-fullbleed",
          highlightCard: { enabled: false, kicker: "", title: "", price: 0 },
          content: { limeShowroom: {}, darkSpotlight: {}, photoFullbleed: {} },
        },
        collectorPicks: { enabled: true },
        featuredProducts: { enabled: true },
        brandsStrip: { enabled: true },
        newArrivals: { enabled: true },
        whyChooseUs: { enabled: true },
        collectorPromise: { enabled: true },
        testimonials: { enabled: true },
        instagramFeed: { enabled: true },
        newsletter: { enabled: true },
      },
      navigation: { headerLinks: [], footerLinks: [], footerText: "" },
      seoDefaults: { title: "", description: "" },
      faqs: [],
    },
  });

  const shopByShelf = useFieldArray({ control, name: "shopByShelf" });
  const whyChooseUs = useFieldArray({ control, name: "whyChooseUs" });
  const testimonials = useFieldArray({ control, name: "testimonials" });
  const faqs = useFieldArray({ control, name: "faqs" });
  const shippingZones = useFieldArray({ control, name: "shippingZones" });
  const headerLinks = useFieldArray({ control, name: "navigation.headerLinks" });
  const footerLinks = useFieldArray({ control, name: "navigation.footerLinks" });
  const announceDesktopMsgs = useFieldArray({ control, name: "announcementBar.desktop.messages" });
  const announceMobileMsgs = useFieldArray({ control, name: "announcementBar.mobile.messages" });

  // Live values for row summaries and previews — the collapsed rows show the
  // CURRENT name/fee/question, not the snapshot from when the page loaded.
  const barW = watch("announcementBar");
  const highlightOn = watch("homepageSections.hero.highlightCard.enabled");
  const shelfW = watch("shopByShelf") ?? [];
  const whyW = watch("whyChooseUs") ?? [];
  const tmW = watch("testimonials") ?? [];
  const faqW = watch("faqs") ?? [];
  const zoneW = watch("shippingZones") ?? [];
  const hlW = watch("navigation.headerLinks") ?? [];
  const flW = watch("navigation.footerLinks") ?? [];
  const seoW = watch("seoDefaults");

  if (isLoading) return <FullPageLoader />;

  const onSubmit = (values) => {
    updateMutation.mutate(values, {
      onSuccess: (saved) => {
        adminToast("Settings saved");
        // Re-baseline from the SERVER's copy, not the submitted values. The
        // response carries _id/timestamps and any server-side normalisation;
        // baselining against the submitted subset left isDirty stuck true and
        // the save bar permanently armed after a successful save.
        reset(saved);
      },
      // The API sends per-field messages in `errors` ({ section: [msgs] }) —
      // name the failing section instead of a bare "Validation failed".
      onError: (err) => {
        const fieldErrors = err.response?.data?.errors;
        const first = fieldErrors && Object.entries(fieldErrors)[0];
        if (first) {
          const [section, msgs] = first;
          adminToast(`${section}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
          return;
        }
        adminToast(err.response?.data?.message ?? "Could not save settings");
      },
    });
  };

  // Appending opens the new row for editing straight away.
  const appendOpen = (arrayApi, prefix, value) => {
    setOpenRow(`${prefix}:${arrayApi.fields.length}`);
    arrayApi.append(value);
  };

  const sepChar = SEPARATOR_CHARS[barW?.separatorStyle ?? "dot"] ?? "·";
  const previewMsgs = (barW?.desktop?.messages ?? []).map((m) => m?.text).filter(Boolean);
  const heroVariant = HERO_VARIANTS.find((v) => v.key === heroTab) ?? HERO_VARIANTS[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px] pb-24">
      <AdminPageHeader eyebrow="Store configuration" title="Settings" />

      <SettingsChips active={activeSection} onChange={setActiveSection} />

      <div className="flex items-start gap-[18px]">
        <div className="sticky top-6 hidden self-start lg:block">
          <SettingsRail active={activeSection} onChange={setActiveSection} />
        </div>

        <ActiveSectionContext.Provider value={activeSection}>
          <OpenRowContext.Provider value={openRowState}>
            <div className="flex min-w-0 flex-1 flex-col gap-[18px]">

              {/* ------------------------------ HERO ------------------------------ */}
              <Card
                section="hero"
                title="Hero"
                description="The homepage hero — style, image, highlight card, and per-style copy."
                action={
                  <ToggleRow control={control} name="homepageSections.hero.enabled">
                    Show hero
                  </ToggleRow>
                }
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
                  <div>
                    <L>Hero style</L>
                    <Controller
                      control={control}
                      name="homepageSections.hero.variant"
                      render={({ field }) => (
                        <Sel value={field.value ?? "photo-fullbleed"} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="lime-showroom">Lime showroom</option>
                          <option value="dark-spotlight">Dark spotlight</option>
                          <option value="photo-fullbleed">Photo full-bleed</option>
                        </Sel>
                      )}
                    />
                  </div>
                  <div>
                    <L>Hero image</L>
                    <UploadTile
                      control={control}
                      name="homepageSections.hero.image"
                      size={44}
                      tile={
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-[#DCE9B4] bg-gradient-to-br from-[#C9E469] to-[#A8CD2F] text-ink">
                          <ImageIcon size={18} strokeWidth={1.8} />
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* Highlight card sub-panel */}
                <div className="mt-4 rounded-[14px] border border-line-soft bg-[#FCFCF9] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13.5px] font-bold text-ink">Highlight card</div>
                      <div className="mt-0.5 text-[12px] text-faint">Lime / dark hero only</div>
                    </div>
                    <Toggle control={control} name="homepageSections.hero.highlightCard.enabled" label="Highlight card" />
                  </div>
                  {highlightOn && (
                    <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                      <div>
                        <L>Kicker</L>
                        <Input className={adminInputCls} {...register("homepageSections.hero.highlightCard.kicker")} placeholder="MINI GT" />
                      </div>
                      <div>
                        <L>Title</L>
                        <Input className={adminInputCls} {...register("homepageSections.hero.highlightCard.title")} placeholder="Supra A80…" />
                      </div>
                      <div>
                        <L>Price (৳)</L>
                        <Input className={adminInputCls} type="number" {...register("homepageSections.hero.highlightCard.price")} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Per-style copy tabs — one style at a time, like the design. */}
                <div className="mt-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="text-[13.5px] font-bold text-ink">Hero copy per style</div>
                    <div className="text-[12px] text-faint">Blank fields fall back to their defaults</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {HERO_VARIANTS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setHeroTab(key)}
                        className={cn(
                          "h-[34px] rounded-full px-3.5 text-[12.5px] font-semibold transition-colors",
                          heroTab === key ? "bg-ink text-white" : "bg-tile text-ink-soft hover:bg-[#E8E9E0]"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3.5">
                    <HeroVariantFields
                      key={heroVariant.key}
                      register={register}
                      base={`homepageSections.hero.content.${heroVariant.key}`}
                      ph={heroVariant.ph}
                    />
                  </div>
                </div>
              </Card>

              {/* ------------------------- ANNOUNCEMENT BAR ------------------------ */}
              <Card
                section="announcement"
                title="Announcement bar"
                description="The strip above the header. Desktop and mobile carry separate messages — turning a device off hides its bar."
              >
                {/* Live preview strip rendered with the chosen colours. */}
                <div className="overflow-hidden rounded-[12px] border border-line-soft">
                  <div
                    className="truncate whitespace-nowrap px-3.5 py-[9px] text-[11.5px] font-semibold tracking-[0.02em]"
                    style={{ background: barW?.bgColor || "#101208", color: barW?.textColor || "#DDDFD2" }}
                  >
                    {previewMsgs.length ? previewMsgs.join(` ${sepChar} `) : "Add a desktop message below to preview the bar"}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
                  {[
                    ["Background", "announcementBar.bgColor", "#101208"],
                    ["Text", "announcementBar.textColor", "#DDDFD2"],
                    ["Icons", "announcementBar.iconColor", "#A8CD2F"],
                    ["Separators", "announcementBar.separatorColor", "#A8CD2F"],
                  ].map(([label, name, fallback]) => (
                    <div key={name}>
                      <L>{label}</L>
                      <ColorPair control={control} name={name} fallback={fallback} />
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
                  <div>
                    <L>Separator style</L>
                    <Controller
                      control={control}
                      name="announcementBar.separatorStyle"
                      render={({ field }) => (
                        <Sel value={field.value || "dot"} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="dot">· Dot</option>
                          <option value="pipe">| Pipe</option>
                          <option value="slash">/ Slash</option>
                          <option value="diamond">◆ Diamond</option>
                          <option value="star">✦ Star</option>
                          <option value="none">No separator</option>
                        </Sel>
                      )}
                    />
                  </div>
                  <div>
                    <L hint="(sec / loop)">Scroll speed</L>
                    <Input className={adminInputCls} type="number" min={5} max={120} {...register("announcementBar.scrollSpeed")} />
                  </div>
                </div>

                <div className="mt-4">
                  <ToggleRow control={control} name="announcementBar.showOnAllPages" note="(off = home page only)">
                    Show on all pages
                  </ToggleRow>
                </div>
              </Card>

              {[
                ["Desktop messages", "announcementBar.desktop", announceDesktopMsgs, "desktop"],
                ["Mobile messages", "announcementBar.mobile", announceMobileMsgs, "mobile"],
              ].map(([cardTitle, base, msgs, device]) => (
                <Card
                  key={base}
                  section="announcement"
                  title={cardTitle}
                  action={
                    <div className="flex flex-wrap items-center gap-4">
                      <ToggleRow control={control} name={`${base}.autoScroll`}>
                        <span className="text-[12.5px]">Auto-scroll</span>
                      </ToggleRow>
                      <ToggleRow control={control} name={`${base}.isActive`}>
                        <span className="text-[12.5px]">Show on {device}</span>
                      </ToggleRow>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-2">
                    {msgs.fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Controller
                          control={control}
                          name={`${base}.messages.${index}.icon`}
                          render={({ field: iconField }) => (
                            <Sel
                              className="w-[118px] shrink-0"
                              value={iconField.value || ""}
                              onChange={(e) => iconField.onChange(e.target.value)}
                            >
                              <option value="">No icon</option>
                              {ICON_NAMES.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </Sel>
                          )}
                        />
                        <Input
                          className={cn(adminInputCls, "min-w-0 flex-1")}
                          {...register(`${base}.messages.${index}.text`)}
                          maxLength={120}
                          placeholder="Message text"
                        />
                        <button
                          type="button"
                          aria-label="Delete message"
                          onClick={() => msgs.remove(index)}
                          className="mt-[7px] flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-faint transition-colors hover:border-[#F0C9C5] hover:bg-[#FDF6F5] hover:text-[#B3261E]"
                        >
                          <Trash2 size={13} strokeWidth={1.8} />
                        </button>
                      </div>
                    ))}
                    <AddRowButton onClick={() => msgs.append({ icon: "", text: "" })}>Add message</AddRowButton>
                  </div>
                </Card>
              ))}

              {/* ------------------------- HOMEPAGE SECTIONS ----------------------- */}
              <Card
                section="sections"
                title="Homepage sections"
                description="Show or hide sections on the homepage. The hero has its own controls."
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-2.5">
                  {HOMEPAGE_SECTIONS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-[12px] border border-line-soft bg-[#FCFCF9] px-3.5 py-3"
                    >
                      <span className="text-[13px] font-semibold text-ink">{label}</span>
                      <Toggle control={control} name={`homepageSections.${key}.enabled`} label={label} />
                    </div>
                  ))}
                </div>
              </Card>

              {/* --------------------------- SHOP BY SHELF ------------------------- */}
              <Card
                section="sections"
                title="Shop by shelf"
                description="The tile row on the homepage — each tile has its own image, label, and link, in the order listed. Leave the tiles empty to keep the default Hot Wheels / MINI GT / accessories tiles."
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
                  <div>
                    <L>Section heading</L>
                    <Input className={adminInputCls} {...register("shopByShelfHeading")} placeholder="Shop by shelf" />
                  </div>
                  <div>
                    <L>Section subtitle</L>
                    <Input className={adminInputCls} {...register("shopByShelfSubtitle")} placeholder="Two brands we trust — and the gear that keeps them mint." />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  {shopByShelf.fields.map((field, index) => (
                    <Row
                      key={field.id}
                      id={`tl:${index}`}
                      header={
                        <>
                          {shelfW[index]?.image?.url ? (
                            <img src={shelfW[index].image.url} alt="" className="size-[34px] shrink-0 rounded-[10px] border border-line object-cover" />
                          ) : (
                            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-tile text-faint">
                              <ImageIcon size={14} strokeWidth={1.8} />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-bold text-ink">{shelfW[index]?.label || "New tile"}</span>
                            <span className="block truncate text-[12px] text-faint">{shelfW[index]?.link || "No link yet"}</span>
                          </span>
                        </>
                      }
                    >
                      <UploadTile control={control} name={`shopByShelf.${index}.image`} />
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                        <div>
                          <L>Label</L>
                          <Input className={adminInputCls} {...register(`shopByShelf.${index}.label`, { required: true })} placeholder="Hot Wheels Premium" />
                        </div>
                        <div>
                          <L>Link</L>
                          <Input className={adminInputCls} {...register(`shopByShelf.${index}.link`, { required: true })} placeholder="/shop?brand=hot-wheels-premium" />
                        </div>
                      </div>
                      <RemoveRowButton onClick={() => shopByShelf.remove(index)}>Remove tile</RemoveRowButton>
                    </Row>
                  ))}
                  <AddRowButton onClick={() => appendOpen(shopByShelf, "tl", { label: "", link: "", image: null })}>
                    Add tile
                  </AddRowButton>
                </div>
              </Card>

              {/* ------------------------- FEATURED SPOTLIGHT ---------------------- */}
              <Card
                section="spotlight"
                title="Featured spotlight"
                description="The big card in the homepage 'Featured products' section. Overrides change this card only — never the product itself. Blank = use the product's real value."
              >
                <div className="grid gap-3.5">
                  <div>
                    <L>Spotlight product</L>
                    <Controller
                      control={control}
                      name="featuredSpotlight.productSlug"
                      render={({ field }) => (
                        <Sel value={field.value || ""} onChange={(e) => field.onChange(e.target.value)}>
                          <option value="">First featured product (default)</option>
                          {productList.map((p) => (
                            <option key={p.slug} value={p.slug}>{p.title}</option>
                          ))}
                        </Sel>
                      )}
                    />
                  </div>
                  <div>
                    <L>Image override</L>
                    <UploadTile control={control} name="featuredSpotlight.image" emptyText={<>No<br />override</>} />
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                    <div>
                      <L>Badge override</L>
                      <Input className={adminInputCls} {...register("featuredSpotlight.badge")} placeholder="NEW" />
                    </div>
                    <div>
                      <L>Brand line override</L>
                      <Input className={adminInputCls} {...register("featuredSpotlight.brandLine")} placeholder="Hot Wheels Premium" />
                    </div>
                  </div>
                  <div>
                    <L>Title override</L>
                    <Input className={adminInputCls} {...register("featuredSpotlight.title")} placeholder="Product title shown on the card" />
                  </div>
                  <div>
                    <L>Description override</L>
                    <Textarea className={adminTextareaCls} rows={2} {...register("featuredSpotlight.description")} placeholder="Short description shown on the card (desktop)" />
                  </div>
                </div>
              </Card>

              {/* --------------------------- WHY CHOOSE US ------------------------- */}
              <Card section="trust" title="Why choose us" description="Homepage trust-signal grid.">
                <div className="flex flex-col gap-2.5">
                  {whyChooseUs.fields.map((field, index) => {
                    const RowIcon = ICON_MAP[whyW[index]?.icon] ?? ShieldCheck;
                    return (
                      <Row
                        key={field.id}
                        id={`wy:${index}`}
                        header={
                          <>
                            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] border border-[#DCE9B4] bg-brand-glow text-brand-deep">
                              <RowIcon size={15} strokeWidth={1.8} />
                            </span>
                            <span className="min-w-0 truncate text-[13px] font-bold text-ink">
                              {whyW[index]?.title || "New item"}
                            </span>
                          </>
                        }
                      >
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                          <div>
                            <L>Icon</L>
                            <Controller
                              control={control}
                              name={`whyChooseUs.${index}.icon`}
                              render={({ field: iconField }) => (
                                <Sel value={iconField.value || ICON_NAMES[0]} onChange={(e) => iconField.onChange(e.target.value)}>
                                  {ICON_NAMES.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </Sel>
                              )}
                            />
                          </div>
                          <div>
                            <L>Title</L>
                            <Input className={adminInputCls} {...register(`whyChooseUs.${index}.title`, { required: true })} />
                          </div>
                        </div>
                        <div>
                          <L>Description</L>
                          <Textarea className={adminTextareaCls} rows={2} {...register(`whyChooseUs.${index}.description`)} />
                        </div>
                        <RemoveRowButton onClick={() => whyChooseUs.remove(index)}>Remove item</RemoveRowButton>
                      </Row>
                    );
                  })}
                  <AddRowButton onClick={() => appendOpen(whyChooseUs, "wy", { icon: ICON_NAMES[0], title: "", description: "" })}>
                    Add item
                  </AddRowButton>
                </div>
              </Card>

              {/* ------------------------- COLLECTOR PROMISE ----------------------- */}
              <Card
                section="trust"
                title="Collector promise"
                description="The dark 'Premium Shelf' promo banner between Why Choose Us and Testimonials."
              >
                <div className="grid gap-3.5">
                  <div>
                    <L>Title</L>
                    <Input className={adminInputCls} {...register("collectorPromise.title")} placeholder="Limited runs. Real metal. Gone fast." />
                  </div>
                  <div>
                    <L>Description</L>
                    <Textarea className={adminTextareaCls} rows={3} {...register("collectorPromise.description")} placeholder="Premium castings reach Bangladesh in one batch. When a piece sells through, it's retired — no reprints, no restocks." />
                  </div>
                  <div>
                    <L>Banner image</L>
                    <UploadTile control={control} name="collectorPromise.image" />
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                    <div>
                      <L>Background color</L>
                      <ColorPair control={control} name="collectorPromise.bgColor" fallback="#101208" />
                    </div>
                    <div>
                      <L>Text color</L>
                      <ColorPair control={control} name="collectorPromise.textColor" fallback="#ffffff" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                    <div>
                      <L>Button text</L>
                      <Input className={adminInputCls} {...register("collectorPromise.ctaText")} placeholder="Shop featured" />
                    </div>
                    <div>
                      <L>Button link</L>
                      <Input className={adminInputCls} {...register("collectorPromise.ctaLink")} placeholder="/shop?featured=true" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* --------------------------- TESTIMONIALS -------------------------- */}
              <Card section="testimonials" title="Testimonials" description="Only real customer testimonials — leave empty until collected.">
                <div className="flex flex-col gap-2.5">
                  {testimonials.fields.map((field, index) => (
                    <Row
                      key={field.id}
                      id={`tm:${index}`}
                      header={
                        <>
                          <span className="shrink-0 text-[13px] font-bold text-ink">{tmW[index]?.name || "New testimonial"}</span>
                          <span className="shrink-0 text-[12px] tracking-[0.1em] text-[#B45309]">
                            {"★".repeat(Math.min(5, Math.max(0, Number(tmW[index]?.rating) || 0)))}
                          </span>
                          <span className="min-w-0 truncate text-[12px] text-faint">{tmW[index]?.quote}</span>
                        </>
                      }
                    >
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                        <div>
                          <L>Name</L>
                          <Input className={adminInputCls} {...register(`testimonials.${index}.name`, { required: true })} />
                        </div>
                        <div>
                          <L>Rating (1–5)</L>
                          <Input className={adminInputCls} type="number" min={1} max={5} {...register(`testimonials.${index}.rating`)} />
                        </div>
                      </div>
                      <div>
                        <L>Quote</L>
                        <Textarea className={adminTextareaCls} rows={2} {...register(`testimonials.${index}.quote`, { required: true })} />
                      </div>
                      <RemoveRowButton onClick={() => testimonials.remove(index)}>Remove testimonial</RemoveRowButton>
                    </Row>
                  ))}
                  <AddRowButton onClick={() => appendOpen(testimonials, "tm", { name: "", quote: "", rating: 5 })}>
                    Add testimonial
                  </AddRowButton>
                </div>
              </Card>

              {/* ------------------------------- FAQ ------------------------------- */}
              <Card section="faq" title="FAQ" description="Shown on the public FAQ page.">
                <div className="flex flex-col gap-2.5">
                  {faqs.fields.map((field, index) => (
                    <Row
                      key={field.id}
                      id={`fq:${index}`}
                      header={
                        <>
                          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-tile text-[11px] font-bold text-ink-soft">
                            {index + 1}
                          </span>
                          <span className="min-w-0 truncate text-[13px] font-bold text-ink">{faqW[index]?.question || "New question"}</span>
                        </>
                      }
                    >
                      <div>
                        <L>Question</L>
                        <Input className={adminInputCls} {...register(`faqs.${index}.question`, { required: true })} />
                      </div>
                      <div>
                        <L>Answer</L>
                        <Textarea className={adminTextareaCls} rows={2} {...register(`faqs.${index}.answer`, { required: true })} />
                      </div>
                      <RemoveRowButton onClick={() => faqs.remove(index)}>Remove question</RemoveRowButton>
                    </Row>
                  ))}
                  <AddRowButton onClick={() => appendOpen(faqs, "fq", { question: "", answer: "" })}>Add question</AddRowButton>
                </div>
              </Card>

              {/* ---------------------------- CONTACT ------------------------------ */}
              <Card section="contact" title="Contact info" description="Shown in the footer and on the contact page.">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
                  <div>
                    <L>Email</L>
                    <Input className={adminInputCls} type="email" {...register("contactInfo.email")} />
                  </div>
                  <div>
                    <L>Phone</L>
                    <Input className={adminInputCls} {...register("contactInfo.phone")} />
                  </div>
                  <div>
                    <L>Address</L>
                    <Input className={adminInputCls} {...register("contactInfo.address")} />
                  </div>
                </div>
              </Card>

              <Card section="contact" title="Social links" description="Leave a field blank to hide that icon.">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
                  <div>
                    <L>Facebook</L>
                    <Input className={adminInputCls} {...register("socialLinks.facebook")} placeholder="https://facebook.com/..." />
                  </div>
                  <div>
                    <L>Instagram</L>
                    <Input className={adminInputCls} {...register("socialLinks.instagram")} placeholder="https://instagram.com/..." />
                  </div>
                  <div>
                    <L>YouTube</L>
                    <Input className={adminInputCls} {...register("socialLinks.youtube")} placeholder="https://youtube.com/@..." />
                  </div>
                  <div>
                    <L>WhatsApp</L>
                    <Input className={adminInputCls} {...register("socialLinks.whatsapp")} placeholder="https://wa.me/880..." />
                  </div>
                </div>
              </Card>

              {/* ---------------------------- SHIPPING ----------------------------- */}
              <Card section="shipping" title="Shipping" description="Delivery zones and their flat fees — e.g. Inside Dhaka vs. Outside Dhaka.">
                <div className="flex flex-col gap-2.5">
                  {shippingZones.fields.map((field, index) => (
                    <Row
                      key={field.id}
                      id={`zn:${index}`}
                      header={
                        <>
                          <span className="shrink-0 text-[13px] font-bold text-ink">{zoneW[index]?.name || "New zone"}</span>
                          <span className="shrink-0 text-[12.5px] font-semibold text-[#6B6E60]">
                            ৳{Number(zoneW[index]?.fee || 0).toLocaleString("en-IN")}
                          </span>
                          {zoneW[index]?.requiresPrepay && (
                            <span className="shrink-0 rounded-full border border-[#F2E4C0] bg-[#FDF8EC] px-2 py-[3px] text-[10px] font-bold text-[#B45309]">
                              Prepay required
                            </span>
                          )}
                        </>
                      }
                    >
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                        <div>
                          <L>Zone name</L>
                          <Input className={adminInputCls} {...register(`shippingZones.${index}.name`, { required: true })} />
                        </div>
                        <div>
                          <L>Fee (৳)</L>
                          <Input className={adminInputCls} type="number" {...register(`shippingZones.${index}.fee`, { required: true })} />
                        </div>
                      </div>
                      <ToggleRow control={control} name={`shippingZones.${index}.requiresPrepay`}>
                        <span className="text-[12.5px] font-medium text-ink-soft">
                          Require prepaying the delivery charge before placing an order
                        </span>
                      </ToggleRow>
                      <RemoveRowButton onClick={() => shippingZones.remove(index)}>Remove zone</RemoveRowButton>
                    </Row>
                  ))}
                  <AddRowButton onClick={() => appendOpen(shippingZones, "zn", { name: "", fee: 0, requiresPrepay: false })}>
                    Add zone
                  </AddRowButton>
                </div>
                <div className="mt-4 rounded-[14px] border border-line-soft bg-[#FCFCF9] p-4">
                  <L>Free shipping threshold (৳)</L>
                  <Input className={cn(adminInputCls, "max-w-[230px]")} type="number" {...register("freeShippingThreshold")} />
                  <div className="mt-1.5 text-[12px] text-faint">Set to 0 to disable free shipping.</div>
                </div>
              </Card>

              {/* ---------------------------- PAYMENTS ----------------------------- */}
              <Card
                section="payments"
                heading={
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#E2136E] font-display text-[12px] font-extrabold italic text-white">
                      bK
                    </span>
                    <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-ink">Payment — bKash</h2>
                  </div>
                }
                description="Customers Send Money to this number, then enter the last 4 digits of the bKash number they paid from — match that against your statement."
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] items-start gap-4">
                  <div>
                    <L>Merchant bKash number</L>
                    <Input className={adminInputCls} {...register("bkashConfig.merchantNumber")} />
                  </div>
                  <div>
                    <L>Payment QR code</L>
                    <UploadTile control={control} name="bkashConfig.qrImage" emptyIcon={QrCode} replaceLabel="Replace QR" />
                  </div>
                </div>
              </Card>

              <Card
                section="payments"
                title="Payment — BanglaQR"
                description="Customers scan this QR from any bank/MFS app and enter the resulting payment reference at checkout."
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] items-start gap-4">
                  <div>
                    <L>Account / merchant info</L>
                    <Input className={adminInputCls} {...register("banglaQrConfig.accountInfo")} placeholder="e.g. DiecastBD · 01XXXXXXXXX" />
                  </div>
                  <div>
                    <L>BanglaQR code</L>
                    <UploadTile control={control} name="banglaQrConfig.qrImage" emptyIcon={QrCode} replaceLabel="Replace QR" />
                  </div>
                </div>
              </Card>

              {/* --------------------------- NAVIGATION ---------------------------- */}
              <Card section="navigation" title="Navigation" description="Header and footer links, and the footer tagline.">
                {[
                  ["Header links", headerLinks, hlW, "hl", "navigation.headerLinks", "/shop", "Add header link"],
                  ["Footer links", footerLinks, flW, "fl", "navigation.footerLinks", "/about", "Add footer link"],
                ].map(([groupLabel, api, live, prefix, base, urlPh, addLabel]) => (
                  <div key={base} className={groupLabel === "Footer links" ? "mt-5" : undefined}>
                    <div className="mb-2.5 text-[13.5px] font-bold text-ink">{groupLabel}</div>
                    <div className="flex flex-col gap-2.5">
                      {api.fields.map((field, index) => (
                        <Row
                          key={field.id}
                          id={`${prefix}:${index}`}
                          header={
                            <>
                              <span className="shrink-0 text-[13px] font-bold text-ink">{live[index]?.label || "New link"}</span>
                              <span className="min-w-0 truncate text-[12px] text-faint">{live[index]?.url}</span>
                            </>
                          }
                        >
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
                            <div>
                              <L>Label</L>
                              <Input className={adminInputCls} {...register(`${base}.${index}.label`, { required: true })} />
                            </div>
                            <div>
                              <L>URL</L>
                              <Input className={adminInputCls} {...register(`${base}.${index}.url`, { required: true })} placeholder={urlPh} />
                            </div>
                          </div>
                          <RemoveRowButton onClick={() => api.remove(index)}>Remove link</RemoveRowButton>
                        </Row>
                      ))}
                      <AddRowButton onClick={() => appendOpen(api, prefix, { label: "", url: "" })}>{addLabel}</AddRowButton>
                    </div>
                  </div>
                ))}
                <div className="mt-5">
                  <L>Footer tagline</L>
                  <Textarea className={adminTextareaCls} rows={2} {...register("navigation.footerText")} />
                </div>
              </Card>

              {/* ------------------------------- SEO ------------------------------- */}
              <Card section="seo" title="SEO defaults" description="Used when a page doesn't set its own title or description.">
                <div className="grid gap-3.5">
                  <div>
                    <L>Default title</L>
                    <Input className={adminInputCls} {...register("seoDefaults.title")} />
                  </div>
                  <div>
                    <L>Default description</L>
                    <Textarea className={adminTextareaCls} rows={2} {...register("seoDefaults.description")} />
                  </div>
                  {/* Google-style search preview, live from the fields above. */}
                  <div className="rounded-[14px] border border-line-soft bg-[#FCFCF9] px-4 py-3.5">
                    <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">Search preview</div>
                    <div className="truncate text-[15px] font-semibold leading-[1.3] text-[#1a0dab]">
                      {seoW?.title || "Default title appears here"}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#006621]">thediecastbd.com</div>
                    <div className="mt-0.5 text-[12.5px] leading-[1.5] text-[#545454]">
                      {seoW?.description || "The default description appears here, exactly as a search result would show it."}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </OpenRowContext.Provider>
        </ActiveSectionContext.Provider>
      </div>

      <SaveBar
        dirty={hasDirtyFields(dirtyFields)}
        saving={updateMutation.isPending}
        onDiscard={() => reset()}
        saveLabel="Save settings"
      />
    </form>
  );
}
