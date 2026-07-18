"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShopCart } from "@/lib/shopify/types";
import { getShopifyCartSnapshot } from "@/features/shopify/actions";
import { CartDrawer } from "@/components/cart/CartDrawer";

type CartContextValue = {
  cart: ShopCart;
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  setCart: (cart: ShopCart) => void;
};

const emptyCart: ShopCart = {
  id: "local",
  checkoutUrl: "",
  totalQuantity: 0,
  subtotal: null,
  lines: [],
};

const CartContext = createContext<CartContextValue>({
  cart: emptyCart,
  open: false,
  openCart: () => {},
  closeCart: () => {},
  refreshCart: async () => {},
  setCart: () => {},
});

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopCart>(emptyCart);
  const [open, setOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const next = await getShopifyCartSnapshot();
      setCart(next);
    } catch {
      setCart(emptyCart);
    }
  }, []);

  const openCart = useCallback(() => {
    setOpen(true);
    void refreshCart();
  }, [refreshCart]);

  const closeCart = useCallback(() => setOpen(false), []);

  useEffect(() => {
    void (async () => {
      await refreshCart();
    })();
  }, [refreshCart]);

  useEffect(() => {
    function onOpen() {
      openCart();
    }
    function onUpdated() {
      void refreshCart();
    }
    window.addEventListener("tt:cart-open", onOpen);
    window.addEventListener("tt:cart-updated", onUpdated);
    return () => {
      window.removeEventListener("tt:cart-open", onOpen);
      window.removeEventListener("tt:cart-updated", onUpdated);
    };
  }, [openCart, refreshCart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("cart") === "open") {
      // Defer so the initial render commits before the drawer state flips.
      queueMicrotask(() => openCart());
      params.delete("cart");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
    }
  }, [openCart]);

  const value = useMemo(
    () => ({
      cart,
      open,
      openCart,
      closeCart,
      refreshCart,
      setCart,
    }),
    [cart, open, openCart, closeCart, refreshCart],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tt:cart-updated"));
  }
}

export function notifyCartOpen() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tt:cart-open"));
  }
}
