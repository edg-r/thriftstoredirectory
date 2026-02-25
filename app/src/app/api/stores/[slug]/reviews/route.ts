import { NextRequest, NextResponse } from "next/server";

import { getStoreBySlug, getStoreReviewsBySlug } from "@/lib/directory-data";
import { prisma } from "@/lib/prisma";
import { buildRequestFingerprint, getClientIpFromHeaders } from "@/lib/request-meta";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteParams = {
  params: {
    slug: string;
  };
};

type ReviewPayload = {
  reviewerName?: unknown;
  rating?: unknown;
  comment?: unknown;
  website?: unknown; // honeypot
};

function asOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRating(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < 1 || parsed > 5) return null;
  return parsed;
}

async function parseBody(request: NextRequest): Promise<ReviewPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as ReviewPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return {};
}

export async function GET(_request: Request, { params }: RouteParams) {
  const store = await getStoreBySlug(params.slug);

  if (!store.item) {
    return NextResponse.json(
      {
        error: "Store not found",
        meta: { source: store.source },
      },
      { status: 404 },
    );
  }

  const reviews = await getStoreReviewsBySlug(params.slug, { limit: 20 });

  return NextResponse.json({
    reviews: reviews.items,
    meta: {
      source: reviews.source,
      storeId: store.item.id,
      storeSlug: store.item.slug,
      count: reviews.count,
      averageRating: reviews.averageRating,
    },
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit({
    key: `store-review:${params.slug}:${clientIp}`,
    limit: 4,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many review submissions. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = await parseBody(request);
  const reviewerName = asOptionalString(body.reviewerName)?.slice(0, 60) ?? null;
  const comment = asOptionalString(body.comment)?.slice(0, 1000) ?? null;
  const rating = asRating(body.rating);
  const website = asOptionalString(body.website);

  if (website) {
    return NextResponse.json({ error: "Review rejected" }, { status: 400 });
  }

  const fieldErrors: Record<string, string> = {};
  if (!rating) fieldErrors.rating = "Rating is required (1-5)";
  if (!comment && !reviewerName) {
    fieldErrors.comment = "Add a short comment or your name so reviews are useful";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
  }

  try {
    const store = await prisma.store.findFirst({
      where: { slug: params.slug, status: "ACTIVE" },
      select: { id: true, slug: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const sourceFingerprint = buildRequestFingerprint(request.headers);

    const recentDuplicate = await prisma.storeReview.findFirst({
      where: {
        storeId: store.id,
        sourceFingerprint,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true, createdAt: true },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        { error: "You already submitted a review for this store recently. Try again later." },
        { status: 409 },
      );
    }

    const created = await prisma.storeReview.create({
      data: {
        storeId: store.id,
        reviewerName,
        rating: rating!,
        comment,
        sourceFingerprint,
      },
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    const aggregate = await prisma.storeReview.aggregate({
      where: { storeId: store.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return NextResponse.json(
      {
        review: {
          ...created,
          createdAt: created.createdAt.toISOString(),
        },
        meta: {
          count: aggregate._count._all,
          averageRating:
            typeof aggregate._avg.rating === "number"
              ? Number(aggregate._avg.rating.toFixed(1))
              : null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("store-reviews.create failed", error);
    return NextResponse.json(
      { error: "Failed to create review. Check database configuration." },
      { status: 500 },
    );
  }
}
