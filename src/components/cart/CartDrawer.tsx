"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTransition } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  removeShopifyCartLineAction,
  startShopifyCheckout,
  updateShopifyCartLineAction,
} from "@/features/shopify/actions";
import { formatMoney } from "@/lib/shopify/types";

export function CartDrawer() {
  const { cart, open, closeCart, setCart, refreshCart } = useCart();
  const [pending, startTransition] = useTransition();
  const lines = cart.lines;
  const empty = lines.length === 0;

  function setQty(lineId: string, quantity: number) {
    startTransition(async () => {
      const next = await updateShopifyCartLineAction(lineId, quantity);
      setCart(next);
    });
  }

  function remove(lineId: string) {
    startTransition(async () => {
      const next = await removeShopifyCartLineAction(lineId);
      setCart(next);
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="cart-backdrop"
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
          />
          <motion.aside
            key="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col border-l border-border bg-[#0c0c0e] shadow-[-24px_0_64px_-32px_rgba(0,0,0,0.8)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-metal">
                  Cart
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
                  {empty
                    ? "Empty bay"
                    : `${cart.totalQuantity} item${cart.totalQuantity === 1 ? "" : "s"}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="grid h-10 w-10 place-items-center text-text-muted transition-colors hover:text-text"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {empty ? (
                <p className="py-12 text-center text-sm text-text-muted">
                  Your cart is empty. Pull something from the rack.
                </p>
              ) : (
                <ul className="space-y-5">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-3">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-surface">
                        {line.imageUrl ? (
                          <Image
                            src={line.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">
                          {line.title}
                        </p>
                        {line.variantTitle ? (
                          <p className="mt-0.5 text-xs text-text-muted">
                            {line.variantTitle}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-text">
                          {formatMoney({
                            amount: line.amount,
                            currencyCode: line.currencyCode,
                          })}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center border border-border">
                            <button
                              type="button"
                              disabled={pending}
                              aria-label="Decrease quantity"
                              className="grid h-8 w-8 place-items-center text-text-muted hover:text-text disabled:opacity-40"
                              onClick={() => setQty(line.id, line.quantity - 1)}
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center font-mono text-xs text-text">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={pending}
                              aria-label="Increase quantity"
                              className="grid h-8 w-8 place-items-center text-text-muted hover:text-text disabled:opacity-40"
                              onClick={() => setQty(line.id, line.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => remove(line.id)}
                            className="text-xs text-text-muted transition-colors hover:text-accent disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-text-muted">Estimated total</span>
                <span className="font-[family-name:var(--font-display)] text-lg text-text">
                  {formatMoney(cart.subtotal)}
                </span>
              </div>
              {!empty ? (
                <form action={startShopifyCheckout} className="mb-3">
                  <button
                    type="submit"
                    className="w-full bg-white px-4 py-3 text-sm font-medium tracking-wide text-bg transition-colors hover:bg-white/90"
                  >
                    Checkout
                  </button>
                </form>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  void refreshCart();
                }}
                className="w-full border border-border px-4 py-3 text-sm font-medium tracking-wide text-text transition-colors hover:border-white/40"
              >
                Continue Shopping
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
