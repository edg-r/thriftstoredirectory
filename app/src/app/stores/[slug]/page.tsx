import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "./page.module.css";

import { getStoreBySlug } from "@/lib/directory-data";

type StoreDetailPageProps = {
  params: {
    slug: string;
  };
};

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const result = await getStoreBySlug(params.slug);

  if (!result.item) {
    notFound();
  }

  const store = result.item;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          ← Back to directory
        </Link>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Store Detail</p>
            <h1>{store.name}</h1>
            <p className={styles.address}>
              {store.street1}
              {store.street2 ? `, ${store.street2}` : ""}
              <br />
              {store.city}, {store.state} {store.postalCode ?? ""}
            </p>
          </div>
          <div className={styles.meta}>
            {store.priceTier ? <span className={styles.pill}>{store.priceTier}</span> : null}
            <span className={styles.pillMuted}>
              {result.source === "database" ? "Database" : "Fallback seed"}
            </span>
          </div>
        </header>

        {store.description ? <p className={styles.description}>{store.description}</p> : null}

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h2>Categories</h2>
            <div className={styles.chips}>
              {store.categoryNames.length > 0 ? (
                store.categoryNames.map((name) => (
                  <span className={styles.chip} key={name}>
                    {name}
                  </span>
                ))
              ) : (
                <span className={styles.chipMuted}>No categories assigned</span>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <h2>Contact</h2>
            <ul className={styles.list}>
              <li>
                <strong>Phone:</strong> {store.phone ?? "Not listed"}
              </li>
              <li>
                <strong>Website:</strong>{" "}
                {store.websiteUrl ? (
                  <a href={store.websiteUrl} target="_blank" rel="noreferrer">
                    {store.websiteUrl}
                  </a>
                ) : (
                  "Not listed"
                )}
              </li>
            </ul>
          </div>

          <div className={styles.panel}>
            <h2>Location</h2>
            <ul className={styles.list}>
              <li>
                <strong>Lat/Lng:</strong>{" "}
                {store.latitude != null && store.longitude != null
                  ? `${store.latitude}, ${store.longitude}`
                  : "Not set"}
              </li>
              <li>
                <strong>Slug:</strong> {store.slug}
              </li>
            </ul>
          </div>

          <div className={styles.panel}>
            <h2>Next MVP Items</h2>
            <ul className={styles.list}>
              <li>Opening hours display + open-now status</li>
              <li>Reviews and photo gallery</li>
              <li>User store submission link / duplicate handling</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
