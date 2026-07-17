export type PrintifyShop = {
  id: number;
  title: string;
  sales_channel: string;
};

export type PrintifyBlueprint = {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
};

export type PrintifyPrintProvider = {
  id: number;
  title: string;
  location?: {
    address1?: string | null;
    city?: string | null;
    country?: string | null;
    region?: string | null;
    zip?: string | null;
  };
  decoration_methods?: string[];
  blueprints?: Array<{
    id: number;
    title: string;
    brand: string;
    model: string;
    images: string[];
  }>;
};

export type PrintifyPlaceholder = {
  position: string;
  height?: number;
  width?: number;
  decoration_method?: string;
};

export type PrintifyCatalogVariant = {
  id: number;
  title: string;
  options: {
    color?: string;
    size?: string;
    [key: string]: unknown;
  };
  placeholders: PrintifyPlaceholder[];
  decoration_methods?: string[];
};

export type PrintifyVariantsResponse = {
  id: number;
  title: string;
  variants: PrintifyCatalogVariant[];
};

export type PrintifyUpload = {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
};

export type PrintifyProductVariantInput = {
  id: number;
  price: number;
  is_enabled?: boolean;
  is_default?: boolean;
  sku?: string;
};

export type PrintifyPrintAreaImage = {
  id: string;
  x: number;
  y: number;
  scale: number;
  angle: number;
};

export type PrintifyPrintArea = {
  variant_ids: number[];
  placeholders: Array<{
    position: string;
    images: PrintifyPrintAreaImage[];
  }>;
};

export type PrintifyProductCreate = {
  title: string;
  description?: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: PrintifyProductVariantInput[];
  print_areas: PrintifyPrintArea[];
  tags?: string[];
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: number;
    price: number;
    title?: string;
    sku?: string;
    is_enabled?: boolean;
    is_default?: boolean;
    cost?: number;
  }>;
  print_areas?: PrintifyPrintArea[];
  images?: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  visible?: boolean;
  is_locked?: boolean;
  external?: { id?: string; handle?: string } | null;
  created_at?: string;
  updated_at?: string;
};

export type PrintifyPublishRequest = {
  title: boolean;
  description: boolean;
  images: boolean;
  variants: boolean;
  tags: boolean;
  keyFeatures?: boolean;
  shipping_template?: boolean;
};

export type PrintifyOrder = {
  id: string;
  status: string;
  shipping_method?: number;
  line_items?: Array<{
    product_id?: string;
    quantity?: number;
    variant_id?: number;
  }>;
  total_price?: number;
  total_shipping?: number;
  created_at?: string;
};

export type PrintifyPaginated<T> = {
  current_page: number;
  last_page?: number;
  total?: number;
  data: T[];
};
