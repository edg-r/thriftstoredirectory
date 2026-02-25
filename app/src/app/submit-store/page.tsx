"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import styles from "./page.module.css";

type SubmitResult =
  | { kind: "success"; data: unknown }
  | { kind: "error"; status: number; data: unknown }
  | null;

export default function SubmitStorePage() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/store-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ kind: "error", status: response.status, data });
        return;
      }

      event.currentTarget.reset();
      setResult({ kind: "success", data });
    } catch (error) {
      setResult({
        kind: "error",
        status: 0,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Community Contributions</p>
            <h1>Submit a thrift store</h1>
            <p className={styles.subtitle}>
              Add stores we don&apos;t have yet. Submissions are saved as pending and can be reviewed
              before they appear publicly.
            </p>
          </div>
          <Link href="/" className={styles.backLink}>
            ← Back to directory
          </Link>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            <span>Store name *</span>
            <input name="name" required placeholder="Example Thrift Co." />
          </label>

          <label>
            <span>Street address *</span>
            <input name="street1" required placeholder="123 Main St" />
          </label>

          <div className={styles.row}>
            <label>
              <span>City *</span>
              <input name="city" required placeholder="San Diego" />
            </label>
            <label>
              <span>State</span>
              <input name="state" defaultValue="CA" maxLength={2} />
            </label>
            <label>
              <span>ZIP</span>
              <input name="postalCode" placeholder="92101" />
            </label>
          </div>

          <div className={styles.row}>
            <label>
              <span>Phone</span>
              <input name="phone" placeholder="(619) 555-1234" />
            </label>
            <label>
              <span>Website</span>
              <input name="websiteUrl" placeholder="https://example.com" />
            </label>
          </div>

          <label>
            <span>Notes (optional)</span>
            <textarea
              name="notes"
              rows={4}
              placeholder="Anything helpful: categories, hours, donation notes, etc."
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit store for review"}
          </button>
        </form>

        <section className={styles.resultPanel} aria-live="polite">
          <h2>Submission response</h2>
          <p className={styles.resultHint}>
            Auth is not enforced yet in this placeholder stage. Real user identity and moderation
            workflow come next.
          </p>
          <pre>{result ? JSON.stringify(result, null, 2) : "Submit the form to test the API."}</pre>
        </section>
      </div>
    </main>
  );
}
