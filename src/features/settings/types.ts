import type { EmailFrequency, NotificationEventKey } from "@/features/settings/constants";

export type CommunicationSettings = {
  user_id: string;
  master_enabled: boolean;
  email_frequency: EmailFrequency;
  digest_daily: boolean;
  digest_weekly: boolean;
  digest_monthly: boolean;
  marketing_merchandise: boolean;
  marketing_sales: boolean;
  marketing_events: boolean;
  marketing_features: boolean;
  marketing_community: boolean;
  show_activity_status: boolean;
  allow_mentions: boolean;
  allow_messages_from: "everyone" | "followers" | "none";
  updated_at: string;
};

export type ChannelPreference = {
  event_key: NotificationEventKey | string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
};

export type OrderWithItems = {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  summary: string | null;
  tracking_number: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  receipt_url: string | null;
  invoice_url: string | null;
  currency: string;
  created_at: string;
  items: {
    id: string;
    product_ref: string;
    product_name: string | null;
    product_image_url: string | null;
    quantity: number;
    unit_price_cents: number;
  }[];
};
