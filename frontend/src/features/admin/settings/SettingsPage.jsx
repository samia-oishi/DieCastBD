
import { createContext, useContext, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Plus, Trash2, ImageUp, Sparkles, Megaphone, LayoutGrid, Star, ShieldCheck,
  Quote, HelpCircle, AtSign, Truck, CreditCard, Link2, Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { adminInputCls, adminTextareaCls, adminSelectCls } from "@/features/admin/shell/adminFieldCls";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { SaveBar } from "@/features/admin/shell/SaveBar";
import { adminToast } from "@/features/admin/shell/adminToast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { ICON_MAP } from "@/components/shared/settingsIcons";
import { useSettings } from "@/features/settings/api/useSettings";
import { useProducts } from "@/features/products/api/useProducts";
import { useUpdateSettingsMutation, useUploadSettingsImageMutation } from "./api/useAdminSettings";

const ICON_NAMES = Object.keys(ICON_MAP);

// Which rail item a card belongs to. Cards read it from context rather than
// each call site wrapping itself in a conditional — 16 cards, 12 rail items,
// and some items (Payments, Trust & promise) own more than one card.
const ActiveSectionContext = createContext(null);

function SectionCard({ section, title, description, children }) {
  const active = useContext(ActiveSectionContext);
  if (section && active !== section) return null;
  return (
    <section className="rounded-[18px] border border-line bg-white p-[22px]">
      <h2 className="font-display text-[15.5px] font-bold text-ink md:text-[17px]">{title}</h2>
      {description && <p className="mb-4 mt-1 text-[12.5px] leading-[1.55] text-[#6B6E60]">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

// The rail, grouped exactly as the design specifies.
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
    <FieldGroup>
      <Field>
        <FieldLabel>Badge</FieldLabel>
        <Input className={adminInputCls} {...register(`${base}.badge`)} placeholder={ph.badge} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Title line 1</FieldLabel>
          <Input className={adminInputCls} {...register(`${base}.titleLine1`)} placeholder={ph.titleLine1} />
        </Field>
        <Field>
          <FieldLabel>Title line 2 (emphasized)</FieldLabel>
          <Input className={adminInputCls} {...register(`${base}.titleLine2`)} placeholder={ph.titleLine2} />
        </Field>
      </div>
      <Field>
        <FieldLabel>Subtitle</FieldLabel>
        <Textarea className={adminTextareaCls} rows={2} {...register(`${base}.subtitle`)} placeholder={ph.subtitle} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Primary button text</FieldLabel>
          <Input className={adminInputCls} {...register(`${base}.primaryCtaText`)} placeholder="Explore the collection" />
        </Field>
        <Field>
          <FieldLabel>Primary button link</FieldLabel>
          <Input className={adminInputCls} {...register(`${base}.primaryCtaLink`)} placeholder="/shop" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Secondary button text</FieldLabel>
          <Input className={adminInputCls} {...register(`${base}.secondaryCtaText`)} placeholder="New arrivals" />
        </Field>
        <Field>
          <FieldLabel>Secondary button link</FieldLabel>
          <Input className={adminInputCls} {...register(`${base}.secondaryCtaLink`)} placeholder="/shop" />
        </Field>
      </div>
      <Field>
        <FieldLabel>Footnote</FieldLabel>
        <Input className={adminInputCls} {...register(`${base}.footnote`)} placeholder={ph.footnote} />
      </Field>
    </FieldGroup>
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

function SectionToggleRow({ control, name, label }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm">
          {label}
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </label>
      )}
    />
  );
}

function QrImageField({ control, name, emptyLabel = "No QR", uploadLabel = "Upload QR" }) {
  const uploadMutation = useUploadSettingsImageMutation();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-3">
          {field.value?.url ? (
            <img src={field.value.url} alt="" className="size-20 rounded object-cover" />
          ) : (
            <div className="flex size-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              {emptyLabel}
            </div>
          )}
          <Button variant="outline" size="sm" asChild disabled={uploadMutation.isPending}>
            <label className="cursor-pointer">
              <ImageUp /> {uploadMutation.isPending ? "Uploading…" : uploadLabel}
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
                  }
                }}
              />
            </label>
          </Button>
        </div>
      )}
    />
  );
}

// Native color-picker swatch + hex text input, synced to one field. Blank
// stays blank (renders the fallback shown as the swatch/placeholder) rather
// than writing the fallback into the form.
function ColorField({ control, name, fallback }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={field.value || fallback}
            onChange={(e) => field.onChange(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
          />
          <Input className={cn(adminInputCls, "max-w-[120px]")}
            placeholder={fallback}
            value={field.value || ""}
            onChange={(e) => field.onChange(e.target.value)}
          />
        </div>
      )}
    />
  );
}

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { data: productsResp } = useProducts({ limit: 100 });
  const productList = productsResp?.data ?? [];
  const updateMutation = useUpdateSettingsMutation();

  const [activeSection, setActiveSection] = useState("hero");

  const {
    register,
    control,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px] pb-24">
      <AdminPageHeader eyebrow="Store configuration" title="Settings" />

      <SettingsChips active={activeSection} onChange={setActiveSection} />

      <div className="flex items-start gap-[18px]">
        <div className="sticky top-6 hidden self-start lg:block">
          <SettingsRail active={activeSection} onChange={setActiveSection} />
        </div>

        <ActiveSectionContext.Provider value={activeSection}>
          <div className="flex min-w-0 flex-1 flex-col gap-[18px]">

      {/* Everything hero in ONE place. The old "Hero Banner" slides card is gone —
          the redesigned hero is a single styled section, not a carousel, and only
          ever used one image; the slide text/CTA fields and autoplay controls were
          dead weight the storefront never read. */}
      <SectionCard
        section="hero" title="Hero" description="The homepage hero: style, image, highlight card, and per-style copy.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-6">
            <Controller
              control={control}
              name="homepageSections.hero.enabled"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                  Show hero
                </label>
              )}
            />
            <Field>
              <FieldLabel>Hero style</FieldLabel>
              <Controller
                control={control}
                name="homepageSections.hero.variant"
                render={({ field }) => (
                  <Select key={field.value} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(adminSelectCls, "w-[220px]")}><SelectValue placeholder="Select a hero style" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lime-showroom">Lime showroom</SelectItem>
                      <SelectItem value="dark-spotlight">Dark spotlight</SelectItem>
                      <SelectItem value="photo-fullbleed">Photo full-bleed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>Hero image</FieldLabel>
            <QrImageField control={control} name="homepageSections.hero.image" emptyLabel="No image" uploadLabel="Upload image" />
          </Field>

          <div className="rounded-lg border border-border p-4">
            <Controller
              control={control}
              name="homepageSections.hero.highlightCard.enabled"
              render={({ field }) => (
                <label className="flex items-center justify-between gap-3 text-sm">
                  Highlight card (lime / dark hero only)
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel>Kicker</FieldLabel>
                <Input className={adminInputCls} {...register("homepageSections.hero.highlightCard.kicker")} placeholder="MINI GT" />
              </Field>
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input className={adminInputCls} {...register("homepageSections.hero.highlightCard.title")} placeholder="Supra A80…" />
              </Field>
              <Field>
                <FieldLabel>Price (৳)</FieldLabel>
                <Input className={adminInputCls} type="number" {...register("homepageSections.hero.highlightCard.price")} />
              </Field>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Hero copy per style</p>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Edit the text for each style. Only the style selected above is shown on the homepage. Leave a field blank to use its default (shown as the placeholder).
            </p>
            <div className="flex flex-col gap-4">
              {HERO_VARIANTS.map(({ key, label, ph }) => (
                <div key={key} className="rounded-lg border border-border p-4">
                  <p className="mb-3 text-sm font-medium">{label}</p>
                  <HeroVariantFields register={register} base={`homepageSections.hero.content.${key}`} ph={ph} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        section="announcement"
        title="Announcement Bar"
        description="The strip above the header. Desktop and mobile carry separate messages — turning a device off hides its bar completely."
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border p-4">
            <p className="mb-3 text-sm font-medium">Style</p>
            <div className="flex flex-wrap gap-4">
              {[
                ["Background", "announcementBar.bgColor", "#101208"],
                ["Text", "announcementBar.textColor", "#DDDFD2"],
                ["Icons", "announcementBar.iconColor", "#A8CD2F"],
                ["Separators", "announcementBar.separatorColor", "#A8CD2F"],
              ].map(([label, name, fallback]) => (
                <Field key={name} className="w-fit">
                  <FieldLabel>{label}</FieldLabel>
                  <ColorField control={control} name={name} fallback={fallback} />
                </Field>
              ))}
            </div>
            <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Separator style</FieldLabel>
                <Controller
                  control={control}
                  name="announcementBar.separatorStyle"
                  render={({ field }) => (
                    <Select value={field.value || "dot"} onValueChange={field.onChange}>
                      <SelectTrigger className={adminSelectCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dot">• Dot</SelectItem>
                        <SelectItem value="pipe">| Pipe</SelectItem>
                        <SelectItem value="slash">/ Slash</SelectItem>
                        <SelectItem value="diamond">◆ Diamond</SelectItem>
                        <SelectItem value="star">✦ Star</SelectItem>
                        <SelectItem value="none">No separator</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Scroll speed (sec/loop)</FieldLabel>
                <Input className={adminInputCls} type="number" min={5} max={120} {...register("announcementBar.scrollSpeed")} />
              </Field>
            </div>
            <Controller
              control={control}
              name="announcementBar.showOnAllPages"
              render={({ field }) => (
                <label className="mt-3 flex w-fit items-center gap-2 text-sm text-muted-foreground">
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                  Show on all pages (off = home page only)
                </label>
              )}
            />
          </div>

          {[
            ["Desktop", "announcementBar.desktop", announceDesktopMsgs],
            ["Mobile", "announcementBar.mobile", announceMobileMsgs],
          ].map(([label, base, msgs]) => (
            <div key={base} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">{label} messages</p>
                <div className="flex items-center gap-4">
                  <Controller
                    control={control}
                    name={`${base}.autoScroll`}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        Auto-scroll
                      </label>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`${base}.isActive`}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        Show on {label.toLowerCase()}
                      </label>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {msgs.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <Controller
                      control={control}
                      name={`${base}.messages.${index}.icon`}
                      render={({ field: iconField }) => (
                        // Radix Select forbids a "" item value, so "none" is the
                        // sentinel for "no icon" and maps back to "" in the form.
                        <Select
                          value={iconField.value || "none"}
                          onValueChange={(v) => iconField.onChange(v === "none" ? "" : v)}
                        >
                          <SelectTrigger className={cn(adminSelectCls, "w-[150px] shrink-0")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No icon</SelectItem>
                            {ICON_NAMES.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Input className={adminInputCls}
                      {...register(`${base}.messages.${index}.text`)}
                      maxLength={120}
                      placeholder="e.g. Free shipping on orders over ৳5,000"
                    />
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove message" onClick={() => msgs.remove(index)}>
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => msgs.append({ icon: "", text: "" })}>
                  <Plus /> Add Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        section="sections" title="Homepage Sections" description="Show or hide sections on the homepage. Hero has its own section above.">
        <div className="flex flex-col gap-4">
          {HOMEPAGE_SECTIONS.map(({ key, label }) => (
            <SectionToggleRow key={key} control={control} name={`homepageSections.${key}.enabled`} label={label} />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        section="sections"
        title="Shop by Shelf"
        description="The tile row on the homepage (shown/hidden by the 'Brands Strip' toggle above). Each tile has its own image, label, and link — add as many as you like; they appear in the order listed. Leave the tiles empty to keep the default Hot Wheels / MINI GT / accessories tiles."
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field>
            <FieldLabel>Section heading</FieldLabel>
            <Input className={adminInputCls} {...register("shopByShelfHeading")} placeholder="Shop by shelf" />
          </Field>
          <Field>
            <FieldLabel>Section subtitle</FieldLabel>
            <Input className={adminInputCls} {...register("shopByShelfSubtitle")} placeholder="Two brands we trust — and the gear that keeps them mint." />
          </Field>
        </div>
        <div className="flex flex-col gap-4">
          {shopByShelf.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <QrImageField control={control} name={`shopByShelf.${index}.image`} emptyLabel="No image" uploadLabel="Upload image" />
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove tile" onClick={() => shopByShelf.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Label</FieldLabel>
                  <Input className={adminInputCls} {...register(`shopByShelf.${index}.label`, { required: true })} placeholder="Hot Wheels Premium" />
                </Field>
                <Field>
                  <FieldLabel>Link</FieldLabel>
                  <Input className={adminInputCls} {...register(`shopByShelf.${index}.link`, { required: true })} placeholder="/shop?brand=hot-wheels-premium" />
                </Field>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => shopByShelf.append({ label: "", link: "", image: null })}
          >
            <Plus /> Add Tile
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        section="spotlight"
        title="Featured Spotlight"
        description="The big card in the homepage 'Featured products' section. Pick which product it features, then optionally override how it's shown in this card only — the overrides never change the product itself (its real title, image, and price stay the same everywhere else). Leave the product on 'First featured product' to keep the automatic behavior; leave any override blank to use the product's real value. Add to cart, wishlist, price, and the click-through always stay tied to the real product."
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Spotlight product</FieldLabel>
            <Controller
              control={control}
              name="featuredSpotlight.productSlug"
              render={({ field }) => (
                <Select key={field.value || "none"} value={field.value || "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                  <SelectTrigger className={cn(adminSelectCls, "max-w-md")}>
                    <SelectValue placeholder="First featured product (default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">First featured product (default)</SelectItem>
                    {productList.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field>
            <FieldLabel>Image override</FieldLabel>
            <QrImageField control={control} name="featuredSpotlight.image" emptyLabel="No override" uploadLabel="Upload image" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Badge override</FieldLabel>
              <Input className={adminInputCls} {...register("featuredSpotlight.badge")} placeholder="NEW" />
            </Field>
            <Field>
              <FieldLabel>Brand line override</FieldLabel>
              <Input className={adminInputCls} {...register("featuredSpotlight.brandLine")} placeholder="Hot Wheels Premium" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Title override</FieldLabel>
            <Input className={adminInputCls} {...register("featuredSpotlight.title")} placeholder="Product title shown on the card" />
          </Field>
          <Field>
            <FieldLabel>Description override</FieldLabel>
            <Textarea className={adminTextareaCls} rows={2} {...register("featuredSpotlight.description")} placeholder="Short description shown on the card (desktop)" />
          </Field>
        </FieldGroup>
      </SectionCard>

      <SectionCard
        section="trust" title="Why Choose Us" description="Homepage trust-signal grid.">
        <div className="flex flex-col gap-4">
          {whyChooseUs.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove item" onClick={() => whyChooseUs.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Icon</FieldLabel>
                    <Controller
                      control={control}
                      name={`whyChooseUs.${index}.icon`}
                      render={({ field: iconField }) => (
                        <Select value={iconField.value} onValueChange={iconField.onChange}>
                          <SelectTrigger className={adminSelectCls}>
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_NAMES.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Title</FieldLabel>
                    <Input className={adminInputCls} {...register(`whyChooseUs.${index}.title`, { required: true })} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea className={adminTextareaCls} rows={2} {...register(`whyChooseUs.${index}.description`)} />
                </Field>
              </FieldGroup>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => whyChooseUs.append({ icon: ICON_NAMES[0], title: "", description: "" })}
          >
            <Plus /> Add Item
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        section="trust" title="Collector Promise" description="The dark 'Premium Shelf' promo banner between Why Choose Us and Testimonials.">
        <FieldGroup>
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input className={adminInputCls} {...register("collectorPromise.title")} placeholder="Limited runs. Real metal. Gone fast." />
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea className={adminTextareaCls} rows={3} {...register("collectorPromise.description")} placeholder="Premium castings reach Bangladesh in one batch. When a piece sells through, it's retired — no reprints, no restocks." />
          </Field>
          <Field>
            <FieldLabel>Banner image</FieldLabel>
            <QrImageField control={control} name="collectorPromise.image" emptyLabel="No image" uploadLabel="Upload image" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Background color</FieldLabel>
              <ColorField control={control} name="collectorPromise.bgColor" fallback="#101208" />
            </Field>
            <Field>
              <FieldLabel>Text color</FieldLabel>
              <ColorField control={control} name="collectorPromise.textColor" fallback="#ffffff" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Button text</FieldLabel>
              <Input className={adminInputCls} {...register("collectorPromise.ctaText")} placeholder="Shop featured" />
            </Field>
            <Field>
              <FieldLabel>Button link</FieldLabel>
              <Input className={adminInputCls} {...register("collectorPromise.ctaLink")} placeholder="/shop?featured=true" />
            </Field>
          </div>
        </FieldGroup>
      </SectionCard>

      <SectionCard
        section="testimonials" title="Testimonials" description="Only real customer testimonials — left empty until collected.">
        <div className="flex flex-col gap-4">
          {testimonials.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove testimonial" onClick={() => testimonials.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input className={adminInputCls} {...register(`testimonials.${index}.name`, { required: true })} />
                  </Field>
                  <Field>
                    <FieldLabel>Rating (1-5)</FieldLabel>
                    <Input className={adminInputCls} type="number" min={1} max={5} {...register(`testimonials.${index}.rating`)} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Quote</FieldLabel>
                  <Textarea className={adminTextareaCls} rows={2} {...register(`testimonials.${index}.quote`, { required: true })} />
                </Field>
              </FieldGroup>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => testimonials.append({ name: "", quote: "", rating: 5 })}
          >
            <Plus /> Add Testimonial
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        section="faq" title="FAQ" description="Shown on the public FAQ page.">
        <div className="flex flex-col gap-4">
          {faqs.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove question" onClick={() => faqs.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>Question</FieldLabel>
                  <Input className={adminInputCls} {...register(`faqs.${index}.question`, { required: true })} />
                </Field>
                <Field>
                  <FieldLabel>Answer</FieldLabel>
                  <Textarea className={adminTextareaCls} rows={2} {...register(`faqs.${index}.answer`, { required: true })} />
                </Field>
              </FieldGroup>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => faqs.append({ question: "", answer: "" })}
          >
            <Plus /> Add Question
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        section="contact" title="Social Links">
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field>
              <FieldLabel>Facebook</FieldLabel>
              <Input className={adminInputCls} {...register("socialLinks.facebook")} placeholder="https://facebook.com/..." />
            </Field>
            <Field>
              <FieldLabel>Instagram</FieldLabel>
              <Input className={adminInputCls} {...register("socialLinks.instagram")} placeholder="https://instagram.com/..." />
            </Field>
            <Field>
              <FieldLabel>YouTube</FieldLabel>
              <Input className={adminInputCls} {...register("socialLinks.youtube")} placeholder="https://youtube.com/@..." />
            </Field>
            <Field>
              <FieldLabel>WhatsApp</FieldLabel>
              <Input className={adminInputCls} {...register("socialLinks.whatsapp")} placeholder="https://wa.me/880..." />
            </Field>
          </div>
        </FieldGroup>
      </SectionCard>

      <SectionCard
        section="contact" title="Contact Info">
        <FieldGroup>
          <div className="grid grid-cols-3 gap-3">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input className={adminInputCls} type="email" {...register("contactInfo.email")} />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input className={adminInputCls} {...register("contactInfo.phone")} />
            </Field>
            <Field>
              <FieldLabel>Address</FieldLabel>
              <Input className={adminInputCls} {...register("contactInfo.address")} />
            </Field>
          </div>
        </FieldGroup>
      </SectionCard>

      <SectionCard
        section="shipping" title="Shipping" description="Delivery zones and their flat fees, e.g. Inside Dhaka vs. Outside Dhaka.">
        <div className="flex flex-col gap-4">
          {shippingZones.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove zone" onClick={() => shippingZones.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Zone name</FieldLabel>
                  <Input className={adminInputCls} {...register(`shippingZones.${index}.name`, { required: true })} />
                </Field>
                <Field>
                  <FieldLabel>Fee (৳)</FieldLabel>
                  <Input className={adminInputCls} type="number" {...register(`shippingZones.${index}.fee`, { required: true })} />
                </Field>
              </div>
              <Field orientation="horizontal" className="mt-3">
                <FieldLabel>Require prepaying the delivery charge before placing an order</FieldLabel>
                <Controller
                  control={control}
                  name={`shippingZones.${index}.requiresPrepay`}
                  render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
                />
              </Field>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => shippingZones.append({ name: "", fee: 0, requiresPrepay: false })}
          >
            <Plus /> Add Zone
          </Button>
          <Field>
            <FieldLabel>Free shipping threshold (৳)</FieldLabel>
            <Input className={adminInputCls} type="number" className="max-w-xs" {...register("freeShippingThreshold")} />
            <p className="text-xs text-muted-foreground">Set to 0 to disable free shipping.</p>
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        section="payments"
        title="Payment — bKash"
        description="Customers Send Money to this number (personal account), then enter the last 4 digits of the bKash number they paid from — match that against your statement."
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Merchant bKash number</FieldLabel>
            <Input className={cn(adminInputCls, "max-w-xs")} {...register("bkashConfig.merchantNumber")} />
          </Field>
          <Field>
            <FieldLabel>Payment QR code</FieldLabel>
            <QrImageField control={control} name="bkashConfig.qrImage" />
          </Field>
        </FieldGroup>
      </SectionCard>

      <SectionCard
        section="payments"
        title="Payment — BanglaQR"
        description="Customers scan this QR from any bank/MFS app and enter the resulting payment reference at checkout."
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Account / merchant info</FieldLabel>
            <Input className={cn(adminInputCls, "max-w-xs")} {...register("banglaQrConfig.accountInfo")} placeholder="e.g. DiecastBD · 01XXXXXXXXX" />
          </Field>
          <Field>
            <FieldLabel>BanglaQR code</FieldLabel>
            <QrImageField control={control} name="banglaQrConfig.qrImage" />
          </Field>
        </FieldGroup>
      </SectionCard>

      <SectionCard
        section="navigation" title="Navigation" description="Header and footer links, and the footer tagline.">
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-3 text-sm font-medium">Header links</p>
            <div className="flex flex-col gap-4">
              {headerLinks.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex justify-end">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove link" onClick={() => headerLinks.remove(index)}>
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input className={adminInputCls} {...register(`navigation.headerLinks.${index}.label`, { required: true })} />
                    </Field>
                    <Field>
                      <FieldLabel>URL</FieldLabel>
                      <Input className={adminInputCls} {...register(`navigation.headerLinks.${index}.url`, { required: true })} placeholder="/shop" />
                    </Field>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => headerLinks.append({ label: "", url: "" })}>
                <Plus /> Add Header Link
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Footer links</p>
            <div className="flex flex-col gap-4">
              {footerLinks.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex justify-end">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove link" onClick={() => footerLinks.remove(index)}>
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input className={adminInputCls} {...register(`navigation.footerLinks.${index}.label`, { required: true })} />
                    </Field>
                    <Field>
                      <FieldLabel>URL</FieldLabel>
                      <Input className={adminInputCls} {...register(`navigation.footerLinks.${index}.url`, { required: true })} placeholder="/about" />
                    </Field>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => footerLinks.append({ label: "", url: "" })}>
                <Plus /> Add Footer Link
              </Button>
            </div>
          </div>

          <Field>
            <FieldLabel>Footer tagline</FieldLabel>
            <Textarea className={adminTextareaCls} rows={2} {...register("navigation.footerText")} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        section="seo" title="SEO Defaults">
        <FieldGroup>
          <Field>
            <FieldLabel>Default title</FieldLabel>
            <Input className={adminInputCls} {...register("seoDefaults.title")} />
          </Field>
          <Field>
            <FieldLabel>Default description</FieldLabel>
            <Textarea className={adminTextareaCls} rows={2} {...register("seoDefaults.description")} />
          </Field>
        </FieldGroup>
      </SectionCard>
          </div>
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
