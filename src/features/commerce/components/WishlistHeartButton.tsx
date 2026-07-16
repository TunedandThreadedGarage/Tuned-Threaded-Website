"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toggleWishlistProduct,
} from "@/features/commerce/actions";

export function WishlistHeartButton({
  productRef,
  productName,
  productImageUrl,
  className = "",
}: {
  productRef: string;
  productName: string;
  productImageUrl?: string | null;
  className?: string;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      const { data: wishlist } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!wishlist) return;
      const { data: item } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("wishlist_id", wishlist.id)
        .eq("product_ref", productRef)
        .maybeSingle();
      setSaved(Boolean(item));
    })();
  }, [productRef]);

  if (signedIn === false) {
    return (
      <Link
        href={`/garage/sign-in?next=/store`}
        aria-label="Sign in to save wishlist"
        className={`grid h-10 w-10 place-items-center border border-border text-text-muted transition-colors hover:border-white/40 hover:text-text ${className}`}
      >
        <HeartIcon filled={false} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      disabled={pending || signedIn === null}
      className={`grid h-10 w-10 place-items-center border border-border transition-colors hover:border-white/40 disabled:opacity-40 ${
        saved ? "text-accent" : "text-text-muted hover:text-text"
      } ${className}`}
      onClick={() => {
        start(async () => {
          const res = await toggleWishlistProduct({
            product_ref: productRef,
            product_name: productName,
            product_image_url: productImageUrl ?? null,
          });
          if (!res.error) setSaved(Boolean(res.saved));
        });
      }}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19.2S4.5 14.4 4.5 9.6A3.9 3.9 0 0 1 12 7.2a3.9 3.9 0 0 1 7.5 2.4C19.5 14.4 12 19.2 12 19.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}
