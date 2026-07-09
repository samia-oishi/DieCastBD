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
    shippingFee: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },
    seoDefaults: {
      title: String,
      description: String,
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);
