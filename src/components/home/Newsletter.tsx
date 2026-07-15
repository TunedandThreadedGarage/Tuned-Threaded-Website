"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section
      id="newsletter"
      className="scroll-mt-24 border-t border-border bg-bg py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-10">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-metal">
            Newsletter
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            Stay Tuned.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-muted sm:text-base">
            Drops, builds, and garage culture—straight to your inbox. No noise.
          </p>
        </FadeIn>

        <FadeIn delay={0.12} className="mx-auto mt-10 max-w-lg">
          {submitted ? (
            <p className="text-center text-sm text-text" role="status">
              You&apos;re on the list. We&apos;ll see you in the garage.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="h-12 flex-1 border border-border bg-surface px-4 text-sm text-text placeholder:text-text-muted/70 outline-none transition-colors focus:border-metal"
              />
              <Button type="submit" variant="primary" className="h-12 px-8">
                Subscribe
              </Button>
            </form>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
