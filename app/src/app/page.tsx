import Link from "next/link";
import styles from "./page.module.css";

import { getCategories, getStores } from "@/lib/directory-data";

type HomePageProps = {
  searchParams?: {
    q?: string | string[];
    city?: string | string[];
    category?: string | string[];
    priceTier?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  };
};

type PriceTier = "BUDGET" | "MID" | "PREMIUM";

type FilterState = {
  q: string;
  city: string;
  categories: string[];
  priceTiers: PriceTier[];
  sort: string;
};

const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  BUDGET: "Budget",
  MID: "Mid",
  PREMIUM: "Premium",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function allValues(value: string | string[] | undefined) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function parsePriceTiers(values: string[]) {
  return values.filter(
    (value): value is PriceTier => value === "BUDGET" || value === "MID" || value === "PREMIUM",
  );
}

function buildFilterHref(filters: FilterState, page = 1) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  for (const category of filters.categories) params.append("category", category);
  for (const priceTier of filters.priceTiers) params.append("priceTier", priceTier);
  if (filters.sort) params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function categoryLabelToSlugMap(items: Array<{ slug: string; name: string }>) {
  return new Map(items.map((item) => [item.name, item.slug]));
}

export default async function Home({ searchParams }: HomePageProps) {
  const q = firstValue(searchParams?.q)?.trim() ?? "";
  const city = firstValue(searchParams?.city)?.trim() ?? "";
  const categories = allValues(searchParams?.category);
  const priceTiers = parsePriceTiers(allValues(searchParams?.priceTier));
  const sort = firstValue(searchParams?.sort)?.trim() ?? "city_asc";
  const page = Number.parseInt(firstValue(searchParams?.page) ?? "1", 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const [categoryResult, storeResult] = await Promise.all([
    getCategories(),
    getStores({
      q: q || undefined,
      city: city || undefined,
      categories,
      priceTiers,
      sort:
        sort === "name_asc" || sort === "name_desc" || sort === "city_asc" || sort === "city_desc"
          ? sort
          : undefined,
      page: safePage,
      limit: 12,
    }),
  ]);

  const sourceLabel =
    storeResult.source === "database" ? "Database" : "Fallback seed data (DB offline)";

  const filters: FilterState = { q, city, categories, priceTiers, sort };
  const categoryNameToSlug = categoryLabelToSlugMap(categoryResult.items);
  const selectedCount = categories.length + priceTiers.length + (q ? 1 : 0) + (city ? 1 : 0);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>San Diego County MVP</p>
        <h1>Thrift Store Directory</h1>
        <p className={styles.subtitle}>
          Browse local thrift stores, test search/filter behavior, and grow the directory with
          curated and user-submitted listings.
        </p>

        <div className={styles.heroActions}>
          <Link href="/submit-store" className={styles.primaryAction}>
            Submit a store
          </Link>
          <span className={styles.actionHint}>New submissions are saved for admin review.</span>
        </div>

        <form className={styles.searchForm} method="get">
          {categories.map((value) => (
            <input key={`category-hidden-${value}`} type="hidden" name="category" value={value} />
          ))}
          {priceTiers.map((value) => (
            <input key={`price-hidden-${value}`} type="hidden" name="priceTier" value={value} />
          ))}
          <label className={styles.field}>
            <span>Search</span>
            <input type="text" name="q" defaultValue={q} placeholder="Store name, street, or city" />
          </label>
          <label className={styles.field}>
            <span>City</span>
            <input type="text" name="city" defaultValue={city} placeholder="San Diego" />
          </label>
          <label className={styles.field}>
            <span>Quick add category</span>
            <select
              name="category"
              defaultValue=""
              aria-label="Add a category filter (can combine multiple via chips below)"
            >
              <option value="">Leave as-is</option>
              {categoryResult.items.map((item) => (
                <option key={item.id} value={item.slug} disabled={categories.includes(item.slug)}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Quick add price tier</span>
            <select
              name="priceTier"
              defaultValue=""
              aria-label="Add a price tier filter (can combine multiple via chips below)"
            >
              <option value="">Leave as-is</option>
              <option value="BUDGET" disabled={priceTiers.includes("BUDGET")}>Budget</option>
              <option value="MID" disabled={priceTiers.includes("MID")}>Mid</option>
              <option value="PREMIUM" disabled={priceTiers.includes("PREMIUM")}>Premium</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Sort</span>
            <select name="sort" defaultValue={sort}>
              <option value="city_asc">City (A-Z)</option>
              <option value="city_desc">City (Z-A)</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </label>
          <button className={styles.searchButton} type="submit">
            Search
          </button>
        </form>

        <div className={styles.metaRow}>
          <span>{storeResult.total} stores</span>
          <span>{categoryResult.items.length} categories</span>
          <span>{sourceLabel}</span>
          {selectedCount > 0 ? <span>{selectedCount} active filters</span> : null}
        </div>

        {(categories.length > 0 || priceTiers.length > 0 || q || city) && (
          <div className={styles.activeFilters}>
            {q ? (
              <Link
                className={styles.activeFilterChip}
                href={buildFilterHref({ ...filters, q: "" })}
                title="Remove search"
              >
                Search: {q} ×
              </Link>
            ) : null}
            {city ? (
              <Link
                className={styles.activeFilterChip}
                href={buildFilterHref({ ...filters, city: "" })}
                title="Remove city"
              >
                City: {city} ×
              </Link>
            ) : null}
            {categories.map((categorySlug) => {
              const label = categoryResult.items.find((item) => item.slug === categorySlug)?.name ?? categorySlug;
              return (
                <Link
                  key={`active-category-${categorySlug}`}
                  className={styles.activeFilterChip}
                  href={buildFilterHref({ ...filters, categories: toggleValue(filters.categories, categorySlug) })}
                >
                  {label} ×
                </Link>
              );
            })}
            {priceTiers.map((tier) => (
              <Link
                key={`active-tier-${tier}`}
                className={styles.activeFilterChip}
                href={buildFilterHref({ ...filters, priceTiers: toggleValue(filters.priceTiers, tier) })}
              >
                {PRICE_TIER_LABELS[tier]} ×
              </Link>
            ))}
            <Link className={styles.clearFilters} href="/">
              Clear all
            </Link>
          </div>
        )}
      </section>

      <section className={styles.categories}>
        {categoryResult.items.map((category) => {
          const active = categories.includes(category.slug);
          return (
            <Link
              className={active ? styles.categoryChipActive : styles.categoryChip}
              key={category.id}
              href={buildFilterHref({
                ...filters,
                categories: toggleValue(filters.categories, category.slug),
              })}
            >
              {category.name}
            </Link>
          );
        })}
      </section>

      <section className={styles.priceTierFilters}>
        {(["BUDGET", "MID", "PREMIUM"] as const).map((tier) => {
          const active = priceTiers.includes(tier);
          return (
            <Link
              key={tier}
              className={active ? styles.priceTierFilterActive : styles.priceTierFilter}
              href={buildFilterHref({
                ...filters,
                priceTiers: toggleValue(filters.priceTiers, tier),
              })}
            >
              {PRICE_TIER_LABELS[tier]}
            </Link>
          );
        })}
      </section>

      <section className={styles.listSection}>
        {storeResult.items.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No stores found</h2>
            <p>Try clearing filters or using a broader city/search query.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {storeResult.items.map((store) => (
              <article className={styles.card} key={store.id}>
                <div className={styles.cardHeader}>
                  <h2>
                    <Link href={`/stores/${store.slug}`}>{store.name}</Link>
                  </h2>
                  {store.priceTier ? (
                    <Link
                      className={`${styles.priceTier} ${styles.priceTierClickable}`}
                      href={buildFilterHref({
                        ...filters,
                        priceTiers: toggleValue(filters.priceTiers, store.priceTier),
                      })}
                    >
                      {store.priceTier}
                    </Link>
                  ) : null}
                </div>
                <p className={styles.address}>
                  {store.street1}, {store.city}, {store.state} {store.postalCode ?? ""}
                </p>
                <div className={styles.cardChips}>
                  {store.categoryNames.length > 0 ? (
                    store.categoryNames.map((categoryName) => {
                      const categorySlug = categoryNameToSlug.get(categoryName);
                      if (!categorySlug) {
                        return (
                          <span className={styles.cardChip} key={`${store.id}-${categoryName}`}>
                            {categoryName}
                          </span>
                        );
                      }

                      return (
                        <Link
                          className={styles.cardChipLink}
                          key={`${store.id}-${categoryName}`}
                          href={buildFilterHref({
                            ...filters,
                            categories: toggleValue(filters.categories, categorySlug),
                          })}
                        >
                          {categoryName}
                        </Link>
                      );
                    })
                  ) : (
                    <span className={styles.cardChipMuted}>Uncategorized</span>
                  )}
                </div>
                <p className={styles.slug}>
                  <Link href={`/stores/${store.slug}`}>/stores/{store.slug}</Link>
                </p>
              </article>
            ))}
          </div>
        )}

        <div className={styles.paginationRow}>
          <span className={styles.paginationMeta}>
            Page {storeResult.page} · Showing up to {storeResult.limit} per page
          </span>
          <div className={styles.paginationActions}>
            {storeResult.page > 1 ? (
              <Link className={styles.paginationButton} href={buildFilterHref(filters, storeResult.page - 1)}>
                ← Previous
              </Link>
            ) : (
              <span className={styles.paginationButtonDisabled}>← Previous</span>
            )}
            {storeResult.hasMore ? (
              <Link className={styles.paginationButton} href={buildFilterHref(filters, storeResult.page + 1)}>
                Next →
              </Link>
            ) : (
              <span className={styles.paginationButtonDisabled}>Next →</span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
