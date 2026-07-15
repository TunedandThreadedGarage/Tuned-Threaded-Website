import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { addCartItem, removeCartItem } from "@/features/commerce/actions";
import { CartForm } from "@/features/commerce/components/WishlistForm";
import { DeleteButton } from "@/components/ui/DeleteButton";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: cart } = await supabase
    .from("saved_carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: items } = cart
    ? await supabase
        .from("saved_cart_items")
        .select("*")
        .eq("cart_id", cart.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Saved cart
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Persist items across sessions until checkout exists.
        </p>
      </div>

      <CartForm action={addCartItem} />

      {items && items.length > 0 ? (
        <ul className="divide-y divide-border border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-text">
                  {item.product_name ?? item.product_ref}
                </p>
                <p className="text-xs text-text-muted">Qty {item.quantity}</p>
              </div>
              <DeleteButton
                label="Remove"
                onDelete={removeCartItem.bind(null, item.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Cart is empty" description="Add placeholder line items for now." />
      )}
    </div>
  );
}
