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
  shippingFee: 120,
  freeShippingThreshold: 5000,
  seoDefaults: {
    title: "DiecastBD — Premium Diecast Collectibles in Bangladesh",
    description:
      "Authentic Hot Wheels Premium and MINI GT diecast, curated for collectors. Verified authenticity, nationwide delivery across Bangladesh.",
  },
};
