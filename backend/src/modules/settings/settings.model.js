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

const settingsSchema = new mongoose.Schema(
  {
    heroBanner: { type: [heroSlideSchema], default: [] },
    announcementBar: {
      text: String,
      isActive: { type: Boolean, default: false },
    },
    whyChooseUs: { type: [whyChooseItemSchema], default: [] },
    collectorPromise: {
      title: String,
      description: String,
    },
    testimonials: { type: [testimonialSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
    socialLinks: {
      facebook: String,
      instagram: String,
      whatsapp: String,
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
