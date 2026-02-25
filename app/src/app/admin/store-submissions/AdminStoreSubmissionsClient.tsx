"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./page.module.css";

type Submission = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MERGED_DUPLICATE";
  proposedName: string;
  proposedStreet1: string;
  proposedCity: string;
  proposedState: string;
  proposedPostalCode: string | null;
  proposedPhone: string | null;
  proposedWebsiteUrl: string | null;
  notes: string | null;
  duplicateOfStoreId: string | null;
  reviewerNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  duplicateOfStore: { id: string; slug: string; name: string; city: string } | null;
  approvedStore: { id: string; slug: string; name: string; city: string } | null;
};

type ListResponse = {
  submissions: Submission[];
};

const statusOptions = ["PENDING", "APPROVED", "REJECTED", "MERGED_DUPLICATE"] as const;

type Props = {
  adminKey: string;
};

export default function AdminStoreSubmissionsClient({ adminKey }: Props) {
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("PENDING");
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);

  async function loadSubmissions(nextStatus = statusFilter) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/store-submissions?status=${encodeURIComponent(nextStatus)}&limit=50`,
        {
          headers: { "x-admin-key": adminKey },
        },
      );
      const data = (await response.json()) as ListResponse | { error?: string };

      if (!response.ok) {
        setError("error" in data && data.error ? data.error : "Failed to load submissions");
        setSubmissions([]);
        return;
      }

      setSubmissions((data as ListResponse).submissions);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function runAction(
    submission: Submission,
    action: "approve" | "reject" | "merge_duplicate",
  ) {
    const key = `${submission.id}:${action}`;
    setActiveAction(key);
    setLastResult(null);

    const reviewerNotes =
      action === "reject"
        ? "Rejected in placeholder admin UI"
        : action === "merge_duplicate"
          ? "Marked duplicate in placeholder admin UI"
          : "Approved in placeholder admin UI";

    const payload: Record<string, string> = { action, reviewerNotes };
    if (action === "merge_duplicate" && submission.duplicateOfStoreId) {
      payload.duplicateOfStoreId = submission.duplicateOfStoreId;
    }

    try {
      const response = await fetch(`/api/admin/store-submissions/${submission.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLastResult(data);

      if (!response.ok) return;
      await loadSubmissions(statusFilter);
    } catch (actionError) {
      setLastResult({
        error: actionError instanceof Error ? actionError.message : "Unknown action error",
      });
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Admin (Placeholder)</p>
            <h1>Store submissions moderation</h1>
            <p className={styles.subtitle}>
              Review pending community-submitted stores and approve, reject, or mark duplicates.
            </p>
          </div>
          <div className={styles.headerLinks}>
            <Link href="/submit-store">Submit test store</Link>
            <Link href="/">Directory</Link>
          </div>
        </header>

        <section className={styles.toolbar}>
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as (typeof statusOptions)[number])
              }
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => loadSubmissions(statusFilter)} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </section>

        {error ? (
          <section className={styles.errorBox}>{error}</section>
        ) : (
          <section className={styles.list}>
            {submissions.length === 0 && !loading ? (
              <div className={styles.empty}>No submissions in {statusFilter}.</div>
            ) : null}

            {submissions.map((submission) => {
              const actionPrefix = `${submission.id}:`;
              const mergeDisabled = !submission.duplicateOfStoreId;

              return (
                <article className={styles.card} key={submission.id}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>{submission.proposedName}</h2>
                      <p className={styles.address}>
                        {submission.proposedStreet1}, {submission.proposedCity},{" "}
                        {submission.proposedState} {submission.proposedPostalCode ?? ""}
                      </p>
                    </div>
                    <div className={styles.badges}>
                      <span className={styles.badge}>{submission.status}</span>
                      <span className={styles.badgeMuted}>
                        {new Date(submission.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className={styles.metaGrid}>
                    <p>
                      <strong>Phone:</strong> {submission.proposedPhone ?? "n/a"}
                    </p>
                    <p>
                      <strong>Website:</strong>{" "}
                      {submission.proposedWebsiteUrl ? (
                        <a href={submission.proposedWebsiteUrl} target="_blank" rel="noreferrer">
                          {submission.proposedWebsiteUrl}
                        </a>
                      ) : (
                        "n/a"
                      )}
                    </p>
                  </div>

                  {submission.notes ? <p className={styles.notes}>{submission.notes}</p> : null}

                  {submission.duplicateOfStore ? (
                    <div className={styles.duplicateBox}>
                      Possible duplicate:{" "}
                      <Link href={`/stores/${submission.duplicateOfStore.slug}`}>
                        {submission.duplicateOfStore.name}
                      </Link>{" "}
                      ({submission.duplicateOfStore.city})
                    </div>
                  ) : null}

                  {statusFilter === "PENDING" ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => runAction(submission, "approve")}
                        disabled={activeAction?.startsWith(actionPrefix)}
                      >
                        {activeAction === `${submission.id}:approve` ? "Approving..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => runAction(submission, "reject")}
                        disabled={activeAction?.startsWith(actionPrefix)}
                      >
                        {activeAction === `${submission.id}:reject` ? "Rejecting..." : "Reject"}
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => runAction(submission, "merge_duplicate")}
                        disabled={mergeDisabled || activeAction?.startsWith(actionPrefix)}
                        title={mergeDisabled ? "No duplicate candidate flagged on this submission" : ""}
                      >
                        {activeAction === `${submission.id}:merge_duplicate`
                          ? "Merging..."
                          : "Mark duplicate"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}

        <section className={styles.resultPanel}>
          <h2>Last action response</h2>
          <pre>{lastResult ? JSON.stringify(lastResult, null, 2) : "No actions run yet."}</pre>
        </section>
      </div>
    </main>
  );
}
