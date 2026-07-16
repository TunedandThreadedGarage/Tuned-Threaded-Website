import Link from "next/link";
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
          Saved from the heart icon on product pages. Open anytime from your
          account menu.
        </p>
      </div>

      <WishlistForm action={addWishlistItem} />

      {items && items.length > 0 ? (
        <ul className="divide-y divide-border border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {item.product_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product_image_url}
                    alt=""
                    className="h-14 w-12 object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  {item.product_ref.includes("/") ||
                  item.product_ref.startsWith("gid://") ? (
                    <p className="truncate text-sm font-medium text-text">
                      {item.product_name ?? item.product_ref}
                    </p>
                  ) : (
                    <Link
                      href={`/store/${item.product_ref}`}
                      className="truncate text-sm font-medium text-text hover:underline"
                    >
                      {item.product_name ?? item.product_ref}
                    </Link>
                  )}
                  <p className="font-mono text-xs text-text-muted">
                    {item.product_ref}
                  </p>
                </div>
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
