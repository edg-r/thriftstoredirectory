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

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomePageProps) {
  const q = firstValue(searchParams?.q)?.trim() ?? "";
  const city = firstValue(searchParams?.city)?.trim() ?? "";
  const category = firstValue(searchParams?.category)?.trim() ?? "";
  const priceTier = firstValue(searchParams?.priceTier)?.trim() ?? "";
  const sort = firstValue(searchParams?.sort)?.trim() ?? "city_asc";
  const page = Number.parseInt(firstValue(searchParams?.page) ?? "1", 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const [categoryResult, storeResult] = await Promise.all([
    getCategories(),
    getStores({
      q: q || undefined,
      city: city || undefined,
      category: category || undefined,
      priceTier:
        priceTier === "BUDGET" || priceTier === "MID" || priceTier === "PREMIUM"
          ? priceTier
          : undefined,
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

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>San Diego County MVP</p>
        <h1>Thrift Store Directory</h1>
        <p className={styles.subtitle}>
          Browse local thrift stores, test search/filter behavior, and grow the directory with
          curated and user-submitted listings.
        </p>

        <form className={styles.searchForm} method="get">
          <label className={styles.field}>
            <span>Search</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Store name, street, or city"
            />
          </label>
          <label className={styles.field}>
            <span>City</span>
            <input type="text" name="city" defaultValue={city} placeholder="San Diego" />
          </label>
          <label className={styles.field}>
            <span>Category</span>
            <select name="category" defaultValue={category}>
              <option value="">All categories</option>
              {categoryResult.items.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Price tier</span>
            <select name="priceTier" defaultValue={priceTier}>
              <option value="">Any</option>
              <option value="BUDGET">Budget</option>
              <option value="MID">Mid</option>
              <option value="PREMIUM">Premium</option>
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
        </div>
      </section>

      <section className={styles.categories}>
        {categoryResult.items.map((category) => (
          <span className={styles.categoryChip} key={category.id}>
            {category.name}
          </span>
        ))}
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
                  {store.priceTier ? <span className={styles.priceTier}>{store.priceTier}</span> : null}
                </div>
                <p className={styles.address}>
                  {store.street1}, {store.city}, {store.state} {store.postalCode ?? ""}
                </p>
                <div className={styles.cardChips}>
                  {store.categoryNames.length > 0 ? (
                    store.categoryNames.map((categoryName) => (
                      <span className={styles.cardChip} key={`${store.id}-${categoryName}`}>
                        {categoryName}
                      </span>
                    ))
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
      </section>
    </main>
  );
}
