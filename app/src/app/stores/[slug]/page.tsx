import Link from "next/link";
import { notFound } from "next/navigation";

import StoreReviewsPanel from "./StoreReviewsPanel";
import styles from "./page.module.css";

import { getStoreBySlug, getStoreReviewsBySlug, type StoreHours, type WeekdayCode } from "@/lib/directory-data";

type StoreDetailPageProps = {
  params: {
    slug: string;
  };
};

const DAY_LABELS: Record<WeekdayCode, string> = {
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

function formatTime(value: string | null) {
  if (!value) return null;
  const [hoursRaw, minutesRaw] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutesRaw)) return value;
  const date = new Date();
  date.setHours(hoursRaw, minutesRaw, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getCurrentTimeParts(timezone: string | null) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone ?? "America/Los_Angeles",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const weekday = parts.find((part) => part.type === "weekday")?.value;
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "NaN");
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "NaN");

    return {
      weekday,
      minutes: Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null,
    };
  } catch {
    return { weekday: null, minutes: null };
  }
}

function openNowLabel(hours: StoreHours | null) {
  if (!hours) return null;

  const weekdayMap: Record<string, WeekdayCode> = {
    Sun: "SUN",
    Mon: "MON",
    Tue: "TUE",
    Wed: "WED",
    Thu: "THU",
    Fri: "FRI",
    Sat: "SAT",
  };

  const now = getCurrentTimeParts(hours.timezone);
  const dayCode = now.weekday ? weekdayMap[now.weekday] : null;
  if (!dayCode || now.minutes == null) return null;

  const entry = hours.weekly.find((item) => item.day === dayCode);
  if (!entry || !entry.open || !entry.close) return "Closed now";

  const [openH, openM] = entry.open.split(":").map(Number);
  const [closeH, closeM] = entry.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return now.minutes >= openMinutes && now.minutes < closeMinutes ? "Open now" : "Closed now";
}

function formatAddressForMaps(store: {
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
}) {
  return [store.street1, store.street2, store.city, store.state, store.postalCode]
    .filter(Boolean)
    .join(", ");
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const [result, reviews] = await Promise.all([
    getStoreBySlug(params.slug),
    getStoreReviewsBySlug(params.slug, { limit: 20 }),
  ]);

  if (!result.item) {
    notFound();
  }

  const store = result.item;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    formatAddressForMaps(store),
  )}`;
  const hoursStatus = openNowLabel(store.hours);

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
            {hoursStatus ? <span className={styles.pill}>{hoursStatus}</span> : null}
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
              <li>
                <strong>Maps:</strong>{" "}
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
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
              <li>
                <strong>City:</strong> {store.city}, {store.state}
              </li>
            </ul>
          </div>

          <div className={styles.panel}>
            <h2>Hours</h2>
            {store.hours ? (
              <>
                {store.hours.timezone ? (
                  <p className={styles.panelText}>Timezone: {store.hours.timezone}</p>
                ) : null}
                <ul className={styles.listPlain}>
                  {store.hours.weekly.map((entry) => (
                    <li key={entry.day} className={styles.hoursRow}>
                      <span>{DAY_LABELS[entry.day]}</span>
                      <span>
                        {entry.open && entry.close
                          ? `${formatTime(entry.open)} - ${formatTime(entry.close)}`
                          : "Closed"}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.panelText}>Hours not listed yet.</p>
            )}
            <p className={styles.panelText}>
              Spot missing or outdated info?{" "}
              <Link href="/submit-store" className={styles.inlineLink}>
                Submit a new store / correction
              </Link>
            </p>
          </div>

          <div className={`${styles.panel} ${styles.spanTwo}`}>
            <div className={styles.panelHeader}>
              <h2>Reviews</h2>
              <span className={styles.inlineMeta}>
                {reviews.count} total · {reviews.averageRating != null ? `${reviews.averageRating}/5 avg` : "No rating yet"}
              </span>
            </div>
            <StoreReviewsPanel
              slug={store.slug}
              initialReviews={reviews.items}
              initialCount={reviews.count}
              initialAverageRating={reviews.averageRating}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
