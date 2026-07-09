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
    shippingFee: z.coerce.number().min(0).optional(),
    freeShippingThreshold: z.coerce.number().min(0).optional(),
    seoDefaults: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
  }),
};
