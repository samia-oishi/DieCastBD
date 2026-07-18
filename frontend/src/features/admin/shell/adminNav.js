import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Archive,
  Badge,
  Tag,
  Users,
  Ticket,
  Mail,
  BarChart3,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

// Admin navigation — order + lucide icons per the redesign handoff README.
// `to` is relative to the "/admin" route. Dashboard is the index route (`end`).
export const ADMIN_NAV = [
  { to: "", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "orders", label: "Orders", icon: ClipboardList },
  { to: "products", label: "Products", icon: Package },
  { to: "inventory", label: "Inventory", icon: Archive },
  { to: "brands", label: "Brands", icon: Badge },
  { to: "categories", label: "Categories", icon: Tag },
  { to: "customers", label: "Customers", icon: Users },
  { to: "coupons", label: "Coupons", icon: Ticket },
  { to: "newsletter", label: "Newsletter", icon: Mail },
  { to: "reports", label: "Reports", icon: BarChart3 },
  { to: "pages", label: "Pages", icon: FileText },
  { to: "settings", label: "Settings", icon: SlidersHorizontal },
];
