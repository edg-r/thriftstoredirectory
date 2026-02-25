"use client";

import { FormEvent, useState } from "react";

import styles from "./page.module.css";

import type { StoreReviewItem } from "@/lib/directory-data";

type Props = {
  slug: string;
  initialReviews: StoreReviewItem[];
  initialCount: number;
  initialAverageRating: number | null;
};

type ActionState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function Stars({ rating }: { rating: number }) {
  return <span aria-label={`${rating} out of 5 stars`}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

export default function StoreReviewsPanel({
  slug,
  initialReviews,
  initialCount,
  initialAverageRating,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [count, setCount] = useState(initialCount);
  const [averageRating, setAverageRating] = useState<number | null>(initialAverageRating);
  const [submitting, setSubmitting] = useState(false);
  const [actionState, setActionState] = useState<ActionState>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setActionState({ kind: "idle" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/stores/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionState({
          kind: "error",
          message: typeof data?.error === "string" ? data.error : "Failed to submit review",
        });
        return;
      }

      const review = data.review as StoreReviewItem;
      setReviews((current) => [review, ...current].slice(0, 20));
      if (typeof data?.meta?.count === "number") setCount(data.meta.count);
      setAverageRating(
        typeof data?.meta?.averageRating === "number" ? data.meta.averageRating : averageRating,
      );
      form.reset();
      setActionState({ kind: "success", message: "Review submitted." });
    } catch (error) {
      setActionState({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to submit review",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.reviewsShell}>
      <div className={styles.reviewsSummary}>
        <p>
          <strong>{count}</strong> review{count === 1 ? "" : "s"}
        </p>
        <p>{averageRating != null ? `Average ${averageRating.toFixed(1)}/5` : "No ratings yet"}</p>
      </div>

      <form className={styles.reviewForm} onSubmit={onSubmit}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className={styles.hpField} />
        <label>
          <span>Rating</span>
          <select name="rating" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Okay</option>
            <option value="2">2 - Below expectations</option>
            <option value="1">1 - Poor</option>
          </select>
        </label>
        <label>
          <span>Your name (optional)</span>
          <input name="reviewerName" maxLength={60} placeholder="Anonymous" />
        </label>
        <label>
          <span>Comment (optional)</span>
          <textarea
            name="comment"
            rows={3}
            maxLength={1000}
            placeholder="What was helpful to know before visiting?"
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Add review"}
        </button>
        <p className={styles.reviewHint}>Rate-limited to reduce spam. One recent review per device/browser per store.</p>
        {actionState.kind !== "idle" ? (
          <p className={actionState.kind === "error" ? styles.reviewError : styles.reviewSuccess}>
            {actionState.message}
          </p>
        ) : null}
      </form>

      <div className={styles.reviewList}>
        {reviews.length === 0 ? (
          <p className={styles.panelText}>No reviews yet. Be the first to add one.</p>
        ) : (
          reviews.map((review) => (
            <article className={styles.reviewCard} key={review.id}>
              <div className={styles.reviewCardHeader}>
                <strong>{review.reviewerName ?? "Anonymous"}</strong>
                <span className={styles.reviewStars}>
                  <Stars rating={review.rating} />
                </span>
              </div>
              <p className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</p>
              {review.comment ? <p className={styles.reviewComment}>{review.comment}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
