# Tuned & Threaded — Brand Source of Truth

**This document is the single source of truth for every design and product decision.**

Before any UI, copy, motion, photography, or frontend implementation work, read this file in full and align decisions to it. When something conflicts with taste or a framework default, this document wins.

Companion brief: [`PROJECT.md`](./PROJECT.md) (mission context, future products/features). Prefer this file for design systems and experience rules.

---

## Mission

Build the largest community for home mechanics and automotive enthusiasts.

We are not just a clothing company. We are a lifestyle brand for people who spend more time in the garage than on the couch — built by enthusiasts, for enthusiasts.

---

## Vision

Become the largest garage lifestyle brand in America: the place where home mechanics, builders, and car culture intersect through premium gear, shared builds, and a community that feels like belonging.

The brand should feel as precise as a Porsche interior, as considered as Apple product design, and as garage-honest as Hoonigan culture — premium without pretension.

---

## Target Audience

Primary:

- Home mechanics and DIY builders
- Mustang, Camaro, Corvette, and 350Z / 370Z owners
- Truck enthusiasts and garage-first lifestyle buyers

Secondary:

- People adjacent to car culture who want gear that signals authenticity
- Gift buyers shopping for enthusiasts (clarity and confidence over jargon walls)

Design and copy should assume competence and respect: speak to someone who turns wrenches, not to a generic “streetwear” shopper.

---

## Brand Voice

**Tone:** Confident, honest, premium, community-first. Never corporate fluff, never try-hard hype.

| Do | Don't |
|----|--------|
| Direct, concrete language | Vague lifestyle clichés |
| Respect the craft and the garage | Talk down or over-explain basics |
| Warm community (“us”) | Exclusive gatekeeping |
| Premium without snobbery | Cheap slang, meme spam, or influencer voice |
| Short sentences that hit | Long marketing essays |

**Signature feeling to reinforce:** *“This is where I belong.”*

**Values to surface in words and UI:** Community First · High Quality · Honest · Premium · Built by enthusiasts for enthusiasts.

---

## Typography

Typography should feel precision-engineered: industrial clarity with high-end restraint. Never default stacks (Inter, Roboto, Arial, system-ui alone).

| Role | Direction | Notes |
|------|-----------|--------|
| **Display / brand** | Strong geometric or neo-grotesk sans with mechanical confidence | Hero titles, brand wordmark treatments, section headlines |
| **Body** | Highly legible modern sans with slightly technical character | Product copy, long reading, forms |
| **Accent / mono** | Monospace for specs, SKUs, build details, data | Use sparingly for garage/tech texture — not for paragraphs |

**Rules:**

- One primary display + one body face; mono only for utility texture
- Tight, intentional tracking on large headlines; comfortable measure on body (~60–75 characters)
- High contrast on dark surfaces; never thin grey text on charcoal
- Hierarchy through size and weight — not decorative underlines or sticker labels

**Suggested pairing (implement later):** display = distinctive premium sans (e.g. Syne, Outfit, or similar geometric family); body = clean technical sans (e.g. Manrope or IBM Plex Sans); mono = IBM Plex Mono or JetBrains Mono. Final font files should be licensed and loaded via `next/font`.

---

## Color Palette

**Default theme: dark.** Light mode is not a near-term requirement unless product needs force it.

Palette intent: night garage, brushed metal, warm industrial light — not neon cyberpunk, not purple gradients, not cream/serif “artisan” looks.

| Token | Role | Guidance |
|-------|------|----------|
| `--color-bg` | Page ground | Near-black charcoal (deep graphite, not pure `#000` everywhere) |
| `--color-surface` | Elevated panels | Slightly lighter charcoal / asphalt |
| `--color-border` | Hairlines / dividers | Soft metal grey at low opacity |
| `--color-text` | Primary text | Off-white / warm silver |
| `--color-text-muted` | Secondary text | Cool grey — still readable on dark |
| `--color-accent` | CTAs / focus | Warm industrial accent (ember orange or oil-amber) — rare and intentional |
| `--color-accent-strong` | Critical actions | Deeper burnt/racing red when urgency or commerce needs power |
| `--color-metal` | Highlights | Cool brushed aluminum for icons, edges, inactive chrome |

**Rules:**

- Accent is a signal, not a wash — no full-page purple/indigo gradients
- Prefer atmospheric depth (subtle gradients, light falloff, grain/metal texture) over flat single fills
- Maintain WCAG-sensible contrast on interactive and body text
- Avoid glow-heavy “AI dark mode” aesthetics; keep finishes matte-premium with selective sheen

Exact hex values should be locked into CSS variables during the design-system build and then treated as immutable without a brand update.

---

## UI Principles

1. **One composition.** The first viewport reads as a single scene — brand-forward, not a dashboard.
2. **Brand first.** The Tuned & Threaded name is a hero-level signal. No headline should overpower the brand.
3. **Full-bleed hero by default.** Dominant edge-to-edge imagery or atmospheric ground on promotional surfaces. Avoid inset hero cards, floating media tiles, and collage grids unless a specific interaction requires them.
4. **Hero budget.** First viewport: brand, one headline, one short supporting line, one CTA group, one dominant visual. No stats strips, schedules, address blocks, or secondary promos in the hero.
5. **No hero overlays.** No floating badges, promo stickers, chips, or callout boxes on hero media.
6. **Cards are rare.** Default to no cards. Cards only when they frame a real interaction; if border/shadow/radius isn’t needed for understanding, remove them.
7. **One job per section.** One purpose, one headline, usually one short supporting sentence.
8. **Real visual anchors.** Product, garage, car, tools, people at work — not abstract blobs.
9. **Reduce clutter.** No pill clusters, icon salad, or competing text blocks.
10. **Premium pace.** Dense information is fine in utility areas (PDP specs, account); marketing surfaces stay minimal, fast, and breathable.
11. **Mobile and desktop equal.** Composition must hold on small screens without collapsing into generic stacked cards.

---

## Animation Style

Motion should create presence and hierarchy — garage doors, torque, weight — not noise.

| Principle | Direction |
|-----------|-----------|
| **Feel** | Controlled, weighted, precise — like a well-fit panel closing |
| **Timing** | Medium-short; ease-out / custom curves that settle firmly |
| **Entrances** | Soft fade + slight rise or lateral reveal; avoid bouncing |
| **Scroll** | Subtle parallax or reveal on key sections; never scroll-jack |
| **Hover** | Small, confident state changes (opacity, translate, underlines) |
| **Page** | Shared-element or opacity transitions where Framer Motion helps continuity |

**Do:** 2–3 intentional motion moments per major marketing view.  
**Don't:** Constant particle fields, elastic bounce, rainbow glows, or animation on every element.

Framer Motion is available in the repo; use it for meaningful choreography, not decoration.

---

## Photography Style

| Quality | Direction |
|---------|-----------|
| **Subject** | Real garages, builds in progress, hands, tools, fabric on bodies beside cars, night/work-lamp atmosphere |
| **Lighting** | Practical light: shop lamps, open doors, twilight asphalt — cinematic but believable |
| **Color grade** | Desaturated cool shadows, warm practical highlights; deep blacks; restrained saturation |
| **Composition** | Full-bleed capable images; strong focal subject; negative space for brand/type |
| **People** | Real enthusiasts; authentic posture and clothing; no stock “pointing at clipboard” energy |
| **Product** | Apparel and gear shot as worn/used in context, plus clean detail crops for merch clarity |

**Avoid:** Overly glossy showroom-only imagery as the sole look; neon cyber filters; generic white-cyclorama streetwear that could belong to any brand.

---

## Website Goals

1. Make first-time visitors feel: **“This is where I belong.”**
2. Establish Tuned & Threaded as a **premium garage lifestyle brand**, not only a tee shop.
3. Build trust through honesty, craft, and community cues before hard selling.
4. Create a fast, modern, dark, animated experience that matches Apple-level polish with Porsche restraint and Hoonigan authenticity.
5. Leave clear paths for future community and commerce features (accounts, build showcase, garage journal, wishlist, carts, tracking) without bloating early pages.

**Success criteria for any page:** a visitor unfamiliar with the brand can name the brand, feel the community fit, and know the next action within a few seconds — without visual clutter.

---

## Decision Checklist

Before shipping design or UI code, confirm:

- [ ] Matches mission/vision and audience (enthusiast, not generic apparel)
- [ ] Voice is honest and premium
- [ ] Typography is intentional (not system default stacks)
- [ ] Dark palette and accents follow this document
- [ ] UI principles especially hero/brand rules are respected
- [ ] Motion is purposeful and limited
- [ ] Photography/visuals feel like a real garage culture brand
- [ ] The page advances “This is where I belong.”
