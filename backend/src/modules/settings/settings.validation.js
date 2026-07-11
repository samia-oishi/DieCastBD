import { z } from "zod";

const heroSlide = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.object({ url: z.string().optional(), cloudinaryId: z.string().optional() }).optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

const whyChooseItem = z.object({
  icon: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
});

const testimonial = z.object({
  name: z.string().min(1),
  quote: z.string().min(1),
  rating: z.coerce.number().min(1).max(5).optional(),
});

const faq = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const shippingZone = z.object({
  name: z.string().min(1),
  fee: z.coerce.number().min(0),
  eta: z.string().optional(),
});

const bkashConfig = z.object({
  merchantNumber: z.string().optional(),
  qrImage: z.object({ url: z.string().optional(), cloudinaryId: z.string().optional() }).optional(),
});

const banglaQrConfig = z.object({
  accountInfo: z.string().optional(),
  qrImage: z.object({ url: z.string().optional(), cloudinaryId: z.string().optional() }).optional(),
});

const sectionToggle = z.object({ enabled: z.coerce.boolean().optional() });

const navLink = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

const navigation = z.object({
  headerLinks: z.array(navLink).optional(),
  footerLinks: z.array(navLink).optional(),
  footerText: z.string().optional(),
});

const homepageSections = z.object({
  hero: z
    .object({
      enabled: z.coerce.boolean().optional(),
      autoplay: z.coerce.boolean().optional(),
      autoplayInterval: z.coerce.number().min(1).max(60).optional(),
      variant: z.enum(["lime-showroom", "dark-spotlight", "photo-fullbleed"]).optional(),
      highlightCard: z
        .object({
          enabled: z.coerce.boolean().optional(),
          kicker: z.string().optional(),
          title: z.string().optional(),
          price: z.coerce.number().min(0).optional(),
        })
        .optional(),
    })
    .optional(),
  collectorPicks: sectionToggle.optional(),
  featuredProducts: sectionToggle.optional(),
  brandsStrip: sectionToggle.optional(),
  newArrivals: sectionToggle.optional(),
  whyChooseUs: sectionToggle.optional(),
  collectorPromise: sectionToggle.optional(),
  testimonials: sectionToggle.optional(),
  instagramFeed: sectionToggle.optional(),
  newsletter: sectionToggle.optional(),
});

export const updateSettingsSchema = {
  body: z.object({
    heroBanner: z.array(heroSlide).optional(),
    announcementBar: z.object({ text: z.string().optional(), isActive: z.coerce.boolean().optional() }).optional(),
    whyChooseUs: z.array(whyChooseItem).optional(),
    collectorPromise: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
    testimonials: z.array(testimonial).optional(),
    faqs: z.array(faq).optional(),
    socialLinks: z
      .object({ facebook: z.string().optional(), instagram: z.string().optional(), whatsapp: z.string().optional() })
      .optional(),
    contactInfo: z
      .object({ email: z.string().optional(), phone: z.string().optional(), address: z.string().optional() })
      .optional(),
    shippingZones: z.array(shippingZone).optional(),
    freeShippingThreshold: z.coerce.number().min(0).optional(),
    bkashConfig: bkashConfig.optional(),
    banglaQrConfig: banglaQrConfig.optional(),
    homepageSections: homepageSections.optional(),
    navigation: navigation.optional(),
    seoDefaults: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
  }),
};
