"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string; success?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function addWishlistItem(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const product_ref = String(formData.get("product_ref") ?? "").trim();
    const product_name = String(formData.get("product_name") ?? "").trim();
    if (!product_ref) return { error: "Product reference is required." };

    const { data: wishlist } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!wishlist) return { error: "Wishlist not found." };

    const { error } = await supabase.from("wishlist_items").insert({
      wishlist_id: wishlist.id,
      product_ref,
      product_name: product_name || null,
    });
    if (error) return { error: error.message };
    revalidatePath("/garage/wishlist");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function removeWishlistItem(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: wishlist } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!wishlist) return { error: "Wishlist not found." };

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", id)
      .eq("wishlist_id", wishlist.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/wishlist");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleWishlistProduct(input: {
  product_ref: string;
  product_name?: string | null;
  product_image_url?: string | null;
}): Promise<{ saved?: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const product_ref = input.product_ref.trim();
    if (!product_ref) return { error: "Missing product." };

    const { data: wishlist } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!wishlist) return { error: "Wishlist not found." };

    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("wishlist_id", wishlist.id)
      .eq("product_ref", product_ref)
      .maybeSingle();

    if (existing) {
      await supabase.from("wishlist_items").delete().eq("id", existing.id);
      revalidatePath("/garage/wishlist");
      revalidatePath("/store");
      return { saved: false };
    }

    const { error } = await supabase.from("wishlist_items").insert({
      wishlist_id: wishlist.id,
      product_ref,
      product_name: input.product_name?.trim() || null,
      product_image_url: input.product_image_url ?? null,
    });
    if (error) return { error: error.message };
    revalidatePath("/garage/wishlist");
    revalidatePath("/store");
    return { saved: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addCartItem(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const product_ref = String(formData.get("product_ref") ?? "").trim();
    const product_name = String(formData.get("product_name") ?? "").trim();
    const quantity = Number(formData.get("quantity") ?? 1);

    if (!product_ref) return { error: "Product reference is required." };

    const { data: cart } = await supabase
      .from("saved_carts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!cart) return { error: "Cart not found." };

    const { error } = await supabase.from("saved_cart_items").upsert(
      {
        cart_id: cart.id,
        product_ref,
        product_name: product_name || null,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      },
      { onConflict: "cart_id,product_ref" },
    );
    if (error) return { error: error.message };

    await supabase
      .from("saved_carts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cart.id);

    revalidatePath("/garage/cart");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function removeCartItem(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: cart } = await supabase
      .from("saved_carts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!cart) return { error: "Cart not found." };

    const { error } = await supabase
      .from("saved_cart_items")
      .delete()
      .eq("id", id)
      .eq("cart_id", cart.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/cart");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
