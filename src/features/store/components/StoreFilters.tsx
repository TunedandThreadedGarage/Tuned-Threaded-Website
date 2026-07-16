"use client";

import { STORE_SORTS, type StoreSort } from "@/features/store/constants";
import type { StoreFacets } from "@/lib/shopify/store-catalog";

export type StoreFilterState = {
  search: string;
  collection: string;
  brand: string;
  priceMin: number;
  priceMax: number;
  available: "all" | "in_stock" | "out_of_stock";
  make: string;
  model: string;
  sort: StoreSort;
};

export function defaultFilterState(facets: StoreFacets): StoreFilterState {
  return {
    search: "",
    collection: "",
    brand: "",
    priceMin: facets.priceMin,
    priceMax: facets.priceMax || 500,
    available: "all",
    make: "",
    model: "",
    sort: "featured",
  };
}

export function StoreFilters({
  facets,
  value,
  onChange,
  resultCount,
}: {
  facets: StoreFacets;
  value: StoreFilterState;
  onChange: (next: StoreFilterState) => void;
  resultCount: number;
}) {
  const showMake = facets.makes.length > 0;
  const showModel = facets.models.length > 0;

  function patch(partial: Partial<StoreFilterState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <aside className="space-y-8 border border-border bg-surface/30 p-5 md:p-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
          Filters
        </p>
        <p className="mt-2 text-sm text-text-muted">
          {resultCount} product{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Search
        </span>
        <input
          type="search"
          value={value.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder="Search gear…"
          className="mt-2 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-accent/50 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Sort
        </span>
        <select
          value={value.sort}
          onChange={(e) => patch({ sort: e.target.value as StoreSort })}
          className="mt-2 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent/50 focus:outline-none"
        >
          {STORE_SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {facets.collections.length > 0 ? (
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
            Category
          </span>
          <select
            value={value.collection}
            onChange={(e) => patch({ collection: e.target.value })}
            className="mt-2 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent/50 focus:outline-none"
          >
            <option value="">All collections</option>
            {facets.collections.map((c) => (
              <option key={c.id} value={c.handle}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {facets.brands.length > 0 ? (
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
            Brand
          </span>
          <select
            value={value.brand}
            onChange={(e) => patch({ brand: e.target.value })}
            className="mt-2 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent/50 focus:outline-none"
          >
            <option value="">All brands</option>
            {facets.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Price
        </span>
        <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
          <span>${value.priceMin}</span>
          <span>${value.priceMax}</span>
        </div>
        <input
          type="range"
          min={facets.priceMin}
          max={facets.priceMax || 500}
          value={value.priceMax}
          onChange={(e) => patch({ priceMax: Number(e.target.value) })}
          className="mt-2 w-full accent-[var(--color-accent,#c4121a)]"
        />
        <input
          type="range"
          min={facets.priceMin}
          max={facets.priceMax || 500}
          value={value.priceMin}
          onChange={(e) => patch({ priceMin: Number(e.target.value) })}
          className="mt-1 w-full accent-[var(--color-accent,#c4121a)]"
        />
      </div>

      <fieldset>
        <legend className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Availability
        </legend>
        <div className="mt-3 space-y-2 text-sm text-text">
          {(
            [
              ["all", "All"],
              ["in_stock", "In stock"],
              ["out_of_stock", "Sold out"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="flex items-center gap-2">
              <input
                type="radio"
                name="availability"
                checked={value.available === id}
                onChange={() => patch({ available: id })}
                className="accent-[var(--color-accent,#c4121a)]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {showMake ? (
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
            Vehicle Make
          </span>
          <select
            value={value.make}
            onChange={(e) => patch({ make: e.target.value, model: "" })}
            className="mt-2 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent/50 focus:outline-none"
          >
            <option value="">All makes</option>
            {facets.makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showModel ? (
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
            Vehicle Model
          </span>
          <select
            value={value.model}
            onChange={(e) => patch({ model: e.target.value })}
            className="mt-2 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-accent/50 focus:outline-none"
          >
            <option value="">All models</option>
            {facets.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        type="button"
        onClick={() => onChange(defaultFilterState(facets))}
        className="text-xs text-text-muted underline-offset-4 hover:text-text hover:underline"
      >
        Reset filters
      </button>
    </aside>
  );
}
