export type ProductOption = { label: string; priceDelta: number; display?: string };

export type ProductDTO = {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  compareAtPrice: number | null;
  unit: string;
  minQty: number;
  step: number;
  images: string[];
  options: ProductOption[];
  optionsLabel: string;
  features: string[];
  badge: string | null;
  featured: boolean;
  sales: number;
  leadTime: string;
  sortOrder: number;
  rating: number;
  reviewCount: number;
  sku: string;
  brand: string;
  stock: number | null;
  available: boolean;
  newArrival: boolean;
  colors: { name: string; hex: string }[];
  sizes: string[];
  createdAt: string;
  active: boolean;
  /** true when this product has unpublished in-place edits (visible only in edit/preview mode) */
  hasDraft: boolean;
  /** untranslated values, used by edit forms */
  raw: {
    name: string;
    nameEn: string;
    shortDescription: string;
    shortDescriptionEn: string;
    description: string;
    descriptionEn: string;
  };
};

export type CategoryDTO = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  raw: { name: string; description: string; nameEn: string; descriptionEn: string };
};

export type ReviewDTO = {
  id: number;
  author: string;
  city: string | null;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
  productName?: string;
  productSlug?: string;
};

export type NavItem = { label: string; labelEn: string; href: string; visible: boolean };

export type PaymentMethod = { id: string; label: string; description: string; enabled: boolean };

export type SiteSettings = {
  phone: string;
  whatsapp: string;
  address: string;
  email: string;
  heroImage: string;
  heroTitle: string;
  heroHighlight: string;
  heroText: string;
  logo: string;
  nav: NavItem[];
  shipFee: number;
  shipFreeOver: number;
  taxRate: number;
  taxIncluded: boolean;
  showPrices: boolean;
  lang: "ar" | "en";
};

export type GalleryDTO = {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  active: boolean;
  sortOrder: number;
};
