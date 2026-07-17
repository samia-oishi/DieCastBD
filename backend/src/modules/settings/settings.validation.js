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
  location: z.string().optional(),
});

const faq = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const shippingZone = z.object({
  name: z.string().min(1),
  fee: z.coerce.number().min(0),
  eta: z.string().optional(),
  requiresPrepay: z.coerce.boolean().optional(),
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

const collectorPromise = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.object({ url: z.string().optional(), cloudinaryId: z.string().optional() }).optional(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

const heroVariantContent = z.object({
  badge: z.string().optional(),
  titleLine1: z.string().optional(),
  titleLine2: z.string().optional(),
  subtitle: z.string().optional(),
  primaryCtaText: z.string().optional(),
  primaryCtaLink: z.string().optional(),
  secondaryCtaText: z.string().optional(),
  secondaryCtaLink: z.string().optional(),
  footnote: z.string().optional(),
});

const navLink = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

const shelfTile = z.object({
  label: z.string().min(1),
  link: z.string().min(1),
  image: z.object({ url: z.string().optional(), cloudinaryId: z.string().optional() }).optional(),
});

const featuredSpotlight = z.object({
  productSlug: z.string().optional(),
  image: z.object({ url: z.string().optional(), cloudinaryId: z.string().optional() }).optional(),
  badge: z.string().optional(),
  brandLine: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
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
      content: z
        .object({
          limeShowroom: heroVariantContent.optional(),
          darkSpotlight: heroVariantContent.optional(),
          photoFullbleed: heroVariantContent.optional(),
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

// Hex color or blank ("" = fall back to the shipped design color).
const hexOrEmpty = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color like #A8CD2F")
  .or(z.literal(""))
  .optional();

const announcementDevice = z
  .object({
    isActive: z.coerce.boolean().optional(),
    autoScroll: z.coerce.boolean().optional(),
    messages: z
      .array(
        z.object({
          icon: z.string().max(40).optional(),
          text: z.string().max(120, "Keep each announcement under 120 characters").optional(),
        })
      )
      .max(8, "At most 8 messages per device")
      .optional(),
  })
  .optional();

export const updateSettingsSchema = {
  body: z.object({
    heroBanner: z.array(heroSlide).optional(),
    announcementBar: z
      .object({
        bgColor: hexOrEmpty,
        textColor: hexOrEmpty,
        iconColor: hexOrEmpty,
        separatorColor: hexOrEmpty,
        separatorStyle: z.enum(["dot", "pipe", "slash", "diamond", "star", "none"]).optional(),
        showOnAllPages: z.coerce.boolean().optional(),
        scrollSpeed: z.coerce.number().min(5).max(120).optional(),
        desktop: announcementDevice,
        mobile: announcementDevice,
      })
      .optional(),
    whyChooseUs: z.array(whyChooseItem).optional(),
    shopByShelf: z.array(shelfTile).optional(),
    shopByShelfHeading: z.string().optional(),
    shopByShelfSubtitle: z.string().optional(),
    featuredSpotlight: featuredSpotlight.optional(),
    collectorPromise: collectorPromise.optional(),
    testimonials: z.array(testimonial).optional(),
    faqs: z.array(faq).optional(),
    socialLinks: z
      .object({ facebook: z.string().optional(), instagram: z.string().optional(), whatsapp: z.string().optional(), youtube: z.string().optional() })
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
