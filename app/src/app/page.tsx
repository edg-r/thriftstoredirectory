import styles from "./page.module.css";

import { getCategories, getStores } from "@/lib/directory-data";

type HomePageProps = {
  searchParams?: {
    q?: string | string[];
    city?: string | string[];
    page?: string | string[];
  };
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomePageProps) {
  const q = firstValue(searchParams?.q)?.trim() ?? "";
  const city = firstValue(searchParams?.city)?.trim() ?? "";
  const page = Number.parseInt(firstValue(searchParams?.page) ?? "1", 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const [categoryResult, storeResult] = await Promise.all([
    getCategories(),
    getStores({
      q: q || undefined,
      city: city || undefined,
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
                  <h2>{store.name}</h2>
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
                <p className={styles.slug}>/{store.slug}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
