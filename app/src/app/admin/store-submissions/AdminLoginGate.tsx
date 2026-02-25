"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import styles from "./page.module.css";

export default function AdminLoginGate() {
  const [adminKey, setAdminKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to sign in");
        return;
      }

      window.location.reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.errorBox}>
          <h1>Admin sign in</h1>
          <p>Enter the configured `ADMIN_ACCESS_KEY` to open the moderation queue.</p>
          <form className={styles.adminLoginForm} onSubmit={onSubmit}>
            <label>
              <span>Admin access key</span>
              <input
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Open moderation"}
            </button>
          </form>
          {error ? <p className={styles.loginError}>{error}</p> : null}
          <p>
            <Link href="/">Return to directory</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
