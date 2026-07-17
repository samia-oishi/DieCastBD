import {
  ShieldCheck,
  Package,
  Truck,
  Sparkles,
  Award,
  Clock,
  Heart,
  Star,
  Megaphone,
  Tag,
  Gift,
  BadgeCheck,
  Zap,
} from "lucide-react";

// The curated icon allow-list for admin-editable settings content (Why Choose
// Us items, announcement-bar messages). Explicit map (not `import * as Icons`)
// so bundlers can tree-shake — the full lucide-react set is 1000+ icons.
// The admin Settings editor offers exactly these keys, so a stored name can
// never silently fail to resolve on the live storefront.
// NOTE: existing keys are load-bearing — WhyChooseUs items in the live Settings
// document reference them by name. Extend freely; never rename/remove.
export const ICON_MAP = {
  ShieldCheck,
  Package,
  Truck,
  Sparkles,
  Award,
  Clock,
  Heart,
  Star,
  Megaphone,
  Tag,
  Gift,
  BadgeCheck,
  Zap,
};

export const ICON_NAMES = Object.keys(ICON_MAP);
