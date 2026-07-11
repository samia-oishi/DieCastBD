// Testimonials, social links, and contact info are deliberately left empty here —
// fabricating customer quotes or guessing at real phone/social handles would be
// deceptive if this ever shipped unedited. The frontend hides those sections/fields
// gracefully when empty. Fill them in via PATCH /admin/settings once real content exists.

export const settingsSeed = {
  heroBanner: [
    {
      title: "Authenticity, Cast in Metal.",
      subtitle: "Premium 1:64 diecast from Hot Wheels Premium and MINI GT — verified authentic, delivered nationwide.",
      ctaText: "Explore the Collection",
      ctaLink: "/shop",
    },
    {
      title: "Hot Wheels Premium, Now in Bangladesh.",
      subtitle: "Car Culture, Pop Culture, and F1 Gold Label — Mattel's flagship collector line.",
      ctaText: "Shop Hot Wheels",
      ctaLink: "/shop?brand=hot-wheels-premium",
    },
    {
      title: "MINI GT: JDM Legends, 1:64 Scale.",
      subtitle: "Museum-grade detailing for the cars that defined a culture.",
      ctaText: "Shop MINI GT",
      ctaLink: "/shop?brand=mini-gt",
    },
  ],
  announcementBar: {
    text: "",
    isActive: false,
  },
  whyChooseUs: [
    {
      icon: "ShieldCheck",
      title: "100% Authentic",
      description: "Every piece sourced directly and verified before it reaches you — no replicas, ever.",
    },
    {
      icon: "Package",
      title: "Collector-Grade Packaging",
      description: "Cards and boxes protected in transit — what you see online is what arrives.",
    },
    {
      icon: "Truck",
      title: "Nationwide Delivery",
      description: "Delivered securely across Bangladesh, tracked from dispatch to doorstep.",
    },
    {
      icon: "Sparkles",
      title: "Curated, Not Crowded",
      description: "We list what's genuinely worth collecting — not a warehouse dump.",
    },
  ],
  collectorPromise: {
    title: "The Collector Promise",
    description:
      "DiecastBD exists for people who see more than a toy car. Every model we list is inspected, authenticated, and packaged the way a collector would want to receive it — because we're collectors too. If it's not something we'd add to our own shelf, it doesn't make it to yours.",
  },
  testimonials: [],
  socialLinks: {
    facebook: "",
    instagram: "",
    whatsapp: "",
  },
  contactInfo: {
    email: "",
    phone: "",
    address: "",
  },
  // Both zones seeded at the same ৳120 the site already charged flat, so this
  // migration doesn't silently change real prices — adjust the real per-zone
  // rates via Admin → Settings once known (not fabricated here).
  shippingZones: [
    { name: "Inside Dhaka", fee: 120 },
    { name: "Outside Dhaka", fee: 120 },
  ],
  freeShippingThreshold: 5000,
  // Deliberately empty — no real bKash merchant number/QR to seed with; fill in
  // via Admin → Settings once known (same "seed empty, wait for real content"
  // precedent as testimonials/social links above).
  bkashConfig: {
    merchantNumber: "",
    qrImage: null,
  },
  // Every section enabled, matching the homepage exactly as it renders today —
  // this seed/migration must not make anything disappear on deploy.
  homepageSections: {
    hero: { enabled: true, autoplay: true, autoplayInterval: 6 },
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
  // Matches the site's current hardcoded nav/footer exactly (PublicLayout.jsx's
  // single "Shop" link, Footer.jsx's FOOTER_LINKS + tagline) — this
  // migration must not change what's currently live, only make it editable.
  navigation: {
    headerLinks: [{ label: "Shop", url: "/shop" }],
    footerLinks: [
      { label: "About", url: "/about" },
      { label: "Contact", url: "/contact" },
      { label: "FAQ", url: "/faq" },
      { label: "Shipping Policy", url: "/shipping-policy" },
      { label: "Refund Policy", url: "/refund-policy" },
      { label: "Privacy Policy", url: "/privacy-policy" },
      { label: "Terms & Conditions", url: "/terms-conditions" },
    ],
    footerText: "Premium diecast collectibles for serious collectors in Bangladesh.",
  },
  seoDefaults: {
    title: "Hot Wheels, MINI GT & Diecast Cars in Bangladesh | DiecastBD",
    description:
      "Buy authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh. Verified 1:64 collectibles, collector-grade packaging, and nationwide delivery.",
  },
};
