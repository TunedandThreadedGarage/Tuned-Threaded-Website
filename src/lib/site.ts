export const siteNavLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/store" },
  { label: "Garage", href: "/garage" },
  { label: "Community", href: "/community" },
  { label: "Builds", href: "/builds" },
  { label: "Journal", href: "/journal" },
] as const;

export const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
  { label: "Returns", href: "#returns" },
  { label: "Privacy", href: "#privacy" },
  { label: "Instagram", href: "https://instagram.com", external: true },
  { label: "TikTok", href: "https://tiktok.com", external: true },
  { label: "YouTube", href: "https://youtube.com", external: true },
  { label: "Discord (Coming Soon)", href: "#discord", comingSoon: true },
] as const;

export const categories = [
  {
    id: "performance",
    title: "Performance",
    description: "Built for the drive.",
    href: "#performance",
  },
  {
    id: "apparel",
    title: "Apparel",
    description: "Worn beyond the bay.",
    href: "#apparel",
  },
  {
    id: "garage",
    title: "Garage",
    description: "Tools for the craft.",
    href: "#garage",
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    description: "Culture off the clock.",
    href: "#lifestyle",
  },
] as const;

export const featuredProducts = [
  {
    id: "tee-01",
    name: "Midnight Torque Tee",
    category: "Apparel",
    price: "$48",
  },
  {
    id: "hoodie-01",
    name: "Bay Door Hoodie",
    category: "Apparel",
    price: "$98",
  },
  {
    id: "cap-01",
    name: "Pit Lane Cap",
    category: "Lifestyle",
    price: "$36",
  },
  {
    id: "mat-01",
    name: "Shop Floor Mat",
    category: "Garage",
    price: "$64",
  },
] as const;
