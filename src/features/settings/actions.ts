"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  NOTIFICATION_PREF_EVENTS,
  type EmailFrequency,
  type NotificationEventKey,
} from "@/features/settings/constants";
import type {
  ChannelPreference,
  CommunicationSettings,
  OrderWithItems,
} from "@/features/settings/types";

export type ActionResult = { error?: string; success?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function ensureCommunicationDefaults(
  userId?: string,
): Promise<void> {
  const supabase = await createClient();
  const id =
    userId ??
    (await supabase.auth.getUser()).data.user?.id;
  if (!id) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("ensure_communication_settings", {
    p_user_id: id,
  });
}

export async function loadCommunicationSettings(): Promise<{
  settings: CommunicationSettings | null;
  channels: ChannelPreference[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db.rpc("ensure_communication_settings", {
      p_user_id: user.id,
    });

    const [{ data: settings }, { data: channels }] = await Promise.all([
      db
        .from("communication_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      db
        .from("notification_channel_preferences")
        .select("event_key, email_enabled, in_app_enabled, push_enabled")
        .eq("user_id", user.id),
    ]);

    const channelRows = (channels ?? []) as ChannelPreference[];
    const byKey = new Map<string, ChannelPreference>(
      channelRows.map((c) => [c.event_key, c]),
    );
    const merged: ChannelPreference[] = NOTIFICATION_PREF_EVENTS.map((ev) => {
      const row = byKey.get(ev.key);
      return (
        row ?? {
          event_key: ev.key,
          email_enabled:
            ev.key === "followers" || ev.key === "trending" ? false : true,
          in_app_enabled: true,
          push_enabled: false,
        }
      );
    });

    return {
      settings: (settings as CommunicationSettings | null) ?? null,
      channels: merged,
    };
  } catch (e) {
    return {
      settings: null,
      channels: [],
      error: e instanceof Error ? e.message : "Failed to load settings.",
    };
  }
}

export async function updateCommunicationSettings(
  patch: Partial<
    Omit<CommunicationSettings, "user_id" | "updated_at">
  >,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db.rpc("ensure_communication_settings", {
      p_user_id: user.id,
    });
    const { error } = await db
      .from("communication_settings")
      .update(patch)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/settings");
    revalidatePath("/garage/settings/communication");
    revalidatePath("/garage/settings/notifications");
    revalidatePath("/garage/settings/privacy");
    revalidatePath("/garage/settings/store");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function updateEmailFrequency(
  frequency: EmailFrequency,
): Promise<ActionResult> {
  return updateCommunicationSettings({ email_frequency: frequency });
}

export async function updateChannelPreference(input: {
  eventKey: NotificationEventKey | string;
  email_enabled?: boolean;
  in_app_enabled?: boolean;
  push_enabled?: boolean;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db.rpc("ensure_communication_settings", {
      p_user_id: user.id,
    });

    const { data: existing } = await db
      .from("notification_channel_preferences")
      .select("email_enabled, in_app_enabled, push_enabled")
      .eq("user_id", user.id)
      .eq("event_key", input.eventKey)
      .maybeSingle();

    const row = {
      user_id: user.id,
      event_key: input.eventKey,
      email_enabled: input.email_enabled ?? existing?.email_enabled ?? true,
      in_app_enabled: input.in_app_enabled ?? existing?.in_app_enabled ?? true,
      push_enabled: input.push_enabled ?? existing?.push_enabled ?? false,
    };

    const { error } = await db
      .from("notification_channel_preferences")
      .upsert(row, { onConflict: "user_id,event_key" });
    if (error) return { error: error.message };
    revalidatePath("/garage/settings/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function setMasterNotifications(
  enabled: boolean,
): Promise<ActionResult> {
  return updateCommunicationSettings({ master_enabled: enabled });
}

export async function loadOrders(): Promise<{
  orders: OrderWithItems[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();

    // Prefer Shopify orders (Client Credentials Admin API) matched by account email.
    try {
      const { isShopifyConfigured } = await import("@/lib/shopify/config");
      if (isShopifyConfigured() && user.email) {
        const { getShopifyOrdersForEmail } = await import(
          "@/lib/shopify/orders"
        );
        const shopifyOrders = await getShopifyOrdersForEmail(user.email);
        if (shopifyOrders.length > 0) {
          return { orders: shopifyOrders };
        }
      }
    } catch (e) {
      console.error("[orders:shopify]", e);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: orders, error } = await db
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return { orders: [], error: error.message };

    const ids = (orders ?? []).map((o: { id: string }) => o.id);
    const { data: items } = ids.length
      ? await db.from("order_items").select("*").in("order_id", ids)
      : { data: [] as never[] };

    const byOrder = new Map<string, OrderWithItems["items"]>();
    for (const item of items ?? []) {
      const list = byOrder.get(item.order_id) ?? [];
      list.push({
        id: item.id,
        product_ref: item.product_ref,
        product_name: item.product_name,
        product_image_url: item.product_image_url,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
      });
      byOrder.set(item.order_id, list);
    }

    return {
      orders: ((orders ?? []) as OrderWithItems[]).map((o) => ({
        ...o,
        tracking_number: o.tracking_number ?? null,
        carrier: o.carrier ?? null,
        estimated_delivery: o.estimated_delivery ?? null,
        shipped_at: o.shipped_at ?? null,
        delivered_at: o.delivered_at ?? null,
        cancelled_at: o.cancelled_at ?? null,
        refunded_at: o.refunded_at ?? null,
        receipt_url: o.receipt_url ?? null,
        invoice_url: o.invoice_url ?? null,
        currency: o.currency ?? "usd",
        items: byOrder.get(o.id) ?? [],
      })),
    };
  } catch (e) {
    return {
      orders: [],
      error: e instanceof Error ? e.message : "Failed to load orders.",
    };
  }
}
