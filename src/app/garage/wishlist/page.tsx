import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { addWishlistItem, removeWishlistItem } from "@/features/commerce/actions";
import { WishlistForm } from "@/features/commerce/components/WishlistForm";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: items } = wishlist
    ? await supabase
        .from("wishlist_items")
        .select("*")
        .eq("wishlist_id", wishlist.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Wishlist
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Save product refs until the shop launches. Placeholder-friendly.
        </p>
      </div>

      <WishlistForm action={addWishlistItem} />

      {items && items.length > 0 ? (
        <ul className="divide-y divide-border border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-text">
                  {item.product_name ?? item.product_ref}
                </p>
                <p className="font-mono text-xs text-text-muted">{item.product_ref}</p>
              </div>
              <DeleteButton
                label="Remove"
                onDelete={removeWishlistItem.bind(null, item.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Wishlist is empty"
          description="Add product references you want later."
        />
      )}
    </div>
  );
}
