import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  { url: String, cloudinaryId: String },
  { _id: false }
);

const heroSlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    image: imageSchema,
    ctaText: String,
    ctaLink: String,
  },
  { _id: false }
);

const whyChooseItemSchema = new mongoose.Schema(
  {
    icon: String, // lucide-react icon name, rendered dynamically on the frontend
    title: { type: String, required: true },
    description: String,
  },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    // Optional city/label shown as "· Verified collector, <location>" in the
    // storefront testimonial card (redesign). Seeds empty on fresh installs.
    location: { type: String },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const shippingZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 },
    // Free-text delivery estimate (e.g. "24-48h") shown next to the zone at
    // checkout — display-only, no logic depends on it. Optional so existing
    // zones without one just render no ETA line rather than a fabricated one.
    eta: String,
    // When true, checkout must collect this zone's delivery fee upfront before
    // the order is placed (cuts down on COD refusals for out-of-city orders).
    // Deliberately a per-zone boolean, not a hardcoded "Dhaka" string match —
    // zone names are admin-renamable free text (see this schema's `name`
    // field), so string-matching would silently break if a zone is renamed.
    // Default false — dormant until Phase 4 wires it into order creation.
    requiresPrepay: { type: Boolean, default: false },
  },
  { _id: false }
);

const navLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

// A single "Shop by shelf" tile (the homepage "Brands Strip" section). Fully
// admin-defined — image, label, and link are all editable, so the section is no
// longer hardcoded to the two brands + accessories category. Array position is
// the display order. `link` is a free-text path (e.g. /shop?brand=mini-gt), not
// a brand/category reference, so a tile can point anywhere. When shopByShelf is
// empty the storefront falls back to the legacy brand/category derivation, so an
// un-migrated document keeps rendering today's tiles until an admin configures
// its own.
const shelfTileSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    link: { type: String, required: true },
    image: imageSchema,
  },
  { _id: false }
);

// Per-card overrides for the homepage "Featured products" spotlight (the big
// card). `productSlug` picks which product fills it (blank → the first featured
// product, i.e. today's behavior). The remaining fields override only how that
// product is DISPLAYED in this one card — they never touch the product itself
// (its real title/image/etc. stay intact everywhere else). Blank → the product's
// real value. Price is intentionally not overridable, so the card can't show a
// price the product doesn't actually sell at; Add-to-cart/wishlist/link stay
// bound to the real product.
const featuredSpotlightSchema = new mongoose.Schema(
  {
    productSlug: String,
    image: imageSchema,
    badge: String,
    brandLine: String,
    title: String,
    description: String,
  },
  { _id: false }
);

// Editable copy for a single hero visual style. Every field is optional: when a
// field is blank the storefront falls back to that variant's shipped design
// copy (HeroSection.jsx DEFAULTS), so an un-edited/un-migrated document renders
// exactly as it does today. titleLine2 is the emphasized (italic/lime) line.
const heroVariantContentSchema = new mongoose.Schema(
  {
    badge: String,
    titleLine1: String,
    titleLine2: String,
    subtitle: String,
    primaryCtaText: String,
    primaryCtaLink: String,
    secondaryCtaText: String,
    secondaryCtaLink: String,
    footnote: String,
  },
  { _id: false }
);

// Editable copy + look for the dark "Premium Shelf" promo banner. All fields
// optional: blank title/description/colors fall back to the shipped design
// (PremiumShelfBanner.jsx), blank image keeps the design's dashed placeholder.
const collectorPromiseSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: imageSchema,
    bgColor: String,
    textColor: String,
    ctaText: String,
    ctaLink: String,
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    heroBanner: { type: [heroSlideSchema], default: [] },
    announcementBar: {
      text: String,
      isActive: { type: Boolean, default: false },
    },
    whyChooseUs: { type: [whyChooseItemSchema], default: [] },
    // Homepage "Shop by shelf" tiles (the section toggled by
    // homepageSections.brandsStrip). Empty by default → storefront falls back to
    // the legacy brand/category tiles; once populated it fully replaces them.
    shopByShelf: { type: [shelfTileSchema], default: [] },
    // Editable heading/subtitle for that section. Blank → storefront falls back
    // to its shipped default copy (ShopByShelf.jsx), so an un-edited document
    // renders exactly as before.
    shopByShelfHeading: String,
    shopByShelfSubtitle: String,
    // Overrides for the "Featured products" big spotlight card (display-only, see
    // schema above). Absent → the card renders the first featured product as-is.
    featuredSpotlight: featuredSpotlightSchema,
    collectorPromise: collectorPromiseSchema,
    testimonials: { type: [testimonialSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    socialLinks: {
      facebook: String,
      instagram: String,
      whatsapp: String,
      youtube: String,
    },
    contactInfo: {
      email: String,
      phone: String,
      address: String,
    },
    // Replaces the old flat shippingFee with per-zone pricing (System 2, post-launch
    // requirements). freeShippingThreshold stays a single global override — nothing
    // in the requirement asks for a per-zone threshold.
    shippingZones: { type: [shippingZoneSchema], default: [] },
    freeShippingThreshold: { type: Number, default: 0 },
    // Manual bKash "Send Money" flow (System 4) — customer sends payment to this
    // number outside the app and types the resulting Transaction ID at checkout;
    // there's no live payment gateway integration, admin verifies manually.
    bkashConfig: {
      merchantNumber: String,
      qrImage: imageSchema,
    },
    // Manual BanglaQR flow, same shape/reasoning as bkashConfig above — scan-and-pay
    // from any bank/MFS app, customer types the resulting payment reference at
    // checkout, admin verifies manually. No live gateway integration here either.
    banglaQrConfig: {
      accountInfo: String,
      qrImage: imageSchema,
    },
    // Per-section show/hide for the homepage (System 6, post-launch requirements) —
    // one toggle per section actually rendered on HomePage.jsx today. hero also
    // carries its own autoplay controls since Embla's autoplay delay is otherwise
    // hardcoded. Every section defaults to enabled so a fresh/un-migrated document
    // preserves today's homepage exactly (nothing disappears on deploy).
    homepageSections: {
      hero: {
        enabled: { type: Boolean, default: true },
        autoplay: { type: Boolean, default: true },
        autoplayInterval: { type: Number, default: 6, min: 1, max: 60 },
        // Which of the storefront redesign's 3 hero visual styles to render
        // (design_handoff_diecastbd_storefront) — admin-selectable per the
        // implementation instructions, not a per-slide field, since it's a
        // whole-hero visual choice, not content.
        variant: {
          type: String,
          enum: ["lime-showroom", "dark-spotlight", "photo-fullbleed"],
          default: "photo-fullbleed",
        },
        // Small floating product card on the hero image — only the
        // lime-showroom/dark-spotlight variants render it (photo-fullbleed
        // has no equivalent element in the reference). Defaults off since
        // there's no real content until an admin fills it in — showing an
        // empty/fabricated card by default isn't acceptable.
        highlightCard: {
          enabled: { type: Boolean, default: false },
          kicker: String,
          title: String,
          price: Number,
        },
        // Per-variant editable hero copy (badge/title/subtitle/CTAs/footnote).
        // One content object per visual style so admins can tailor each of the
        // three heroes independently; only the currently selected `variant`
        // renders. All fields optional — blanks fall back to shipped defaults.
        content: {
          limeShowroom: heroVariantContentSchema,
          darkSpotlight: heroVariantContentSchema,
          photoFullbleed: heroVariantContentSchema,
        },
      },
      collectorPicks: { enabled: { type: Boolean, default: true } },
      featuredProducts: { enabled: { type: Boolean, default: true } },
      brandsStrip: { enabled: { type: Boolean, default: true } },
      newArrivals: { enabled: { type: Boolean, default: true } },
      whyChooseUs: { enabled: { type: Boolean, default: true } },
      collectorPromise: { enabled: { type: Boolean, default: true } },
      testimonials: { enabled: { type: Boolean, default: true } },
      instagramFeed: { enabled: { type: Boolean, default: true } },
      newsletter: { enabled: { type: Boolean, default: true } },
    },
    // Header/footer link management (System 10, post-launch requirements) —
    // deliberately just the plain link lists, not the cart/auth-state icons or
    // the announcement bar, per the requirement's own "keep the interface
    // simple" scoping. No separate `order` field — array position is the
    // order, same as every other list field on this document.
    navigation: {
      headerLinks: { type: [navLinkSchema], default: [] },
      footerLinks: { type: [navLinkSchema], default: [] },
      footerText: String,
    },
    seoDefaults: {
      title: String,
      description: String,
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);
