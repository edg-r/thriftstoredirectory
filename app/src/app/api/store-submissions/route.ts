import { NextRequest, NextResponse } from "next/server";

import { getClientIpFromHeaders } from "@/lib/request-meta";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

type StoreSubmissionPayload = {
  name?: unknown;
  street1?: unknown;
  street2?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  phone?: unknown;
  websiteUrl?: unknown;
  notes?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  company?: unknown; // honeypot
};

function asTrimmedString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalNumber(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isLikelyPostalCode(value: string) {
  return /^\d{5}(-\d{4})?$/.test(value);
}

function normalizeForComparison(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function parseBody(request: NextRequest): Promise<StoreSubmissionPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as StoreSubmissionPayload;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return {};
}

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit({
    key: `store-submission:${clientIp}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const name = asTrimmedString(body.name);
  const street1 = asTrimmedString(body.street1);
  const city = asTrimmedString(body.city);
  const state = asOptionalString(body.state) ?? "CA";
  const street2 = asOptionalString(body.street2);
  const postalCode = asOptionalString(body.postalCode);
  const phone = asOptionalString(body.phone);
  const websiteUrl = asOptionalString(body.websiteUrl);
  const notes = asOptionalString(body.notes);
  const latitude = asOptionalNumber(body.latitude);
  const longitude = asOptionalNumber(body.longitude);
  const company = asOptionalString(body.company);

  const fieldErrors: Record<string, string> = {};

  if (company) {
    return NextResponse.json({ error: "Submission rejected" }, { status: 400 });
  }
  if (!name) fieldErrors.name = "Name is required";
  if (!street1) fieldErrors.street1 = "Street address is required";
  if (!city) fieldErrors.city = "City is required";
  if (state && !/^[A-Za-z]{2}$/.test(state)) {
    fieldErrors.state = "State must be a 2-letter code";
  }
  if (postalCode && !isLikelyPostalCode(postalCode)) {
    fieldErrors.postalCode = "ZIP must be 5 digits (optional +4)";
  }
  if (websiteUrl) {
    try {
      const parsed = new URL(websiteUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        fieldErrors.websiteUrl = "Website URL must use http or https";
      }
    } catch {
      fieldErrors.websiteUrl = "Website URL must be a valid URL";
    }
  }
  if (latitude != null && (latitude < -90 || latitude > 90)) {
    fieldErrors.latitude = "Latitude must be between -90 and 90";
  }
  if (longitude != null && (longitude < -180 || longitude > 180)) {
    fieldErrors.longitude = "Longitude must be between -180 and 180";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
  }

  try {
    const safeName = name!;
    const safeStreet1 = street1!;
    const safeCity = city!;
    const safeState = state.toUpperCase();

    const normalizedName = normalizeForComparison(safeName);
    const normalizedStreet = normalizeForComparison(safeStreet1);
    const normalizedCity = normalizeForComparison(safeCity);

    const duplicate = await prisma.store.findFirst({
      where: {
        status: "ACTIVE",
        city: { equals: safeCity, mode: "insensitive" },
        OR: [
          { slug: normalizeForComparison(safeName).replace(/\s+/g, "-") },
          {
            AND: [
              { name: { equals: safeName, mode: "insensitive" } },
              { street1: { equals: safeStreet1, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, slug: true, name: true, street1: true, city: true },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: "Possible duplicate store",
          duplicate,
          meta: { duplicateCheck: "exact-name-address-or-slug" },
        },
        { status: 409 },
      );
    }

    const fuzzyCandidates = await prisma.store.findMany({
      where: {
        status: "ACTIVE",
        city: { equals: safeCity, mode: "insensitive" },
      },
      select: { id: true, slug: true, name: true, street1: true, city: true },
      take: 10,
    });

    const fuzzyMatch = fuzzyCandidates.find((candidate) => {
      const candidateName = normalizeForComparison(candidate.name);
      const candidateStreet = normalizeForComparison(candidate.street1);
      const candidateCity = normalizeForComparison(candidate.city);

      return (
        candidateCity === normalizedCity &&
        (candidateName === normalizedName || candidateStreet === normalizedStreet)
      );
    });

    const submission = await prisma.storeSubmission.create({
      data: {
        proposedName: safeName,
        proposedStreet1: safeStreet1,
        proposedStreet2: street2,
        proposedCity: safeCity,
        proposedState: safeState,
        proposedPostalCode: postalCode,
        proposedPhone: phone,
        proposedWebsiteUrl: websiteUrl,
        proposedLatitude: latitude,
        proposedLongitude: longitude,
        notes,
        status: "PENDING",
        duplicateOfStoreId: fuzzyMatch?.id,
      },
      select: {
        id: true,
        status: true,
        proposedName: true,
        proposedCity: true,
        createdAt: true,
        duplicateOfStoreId: true,
      },
    });

    return NextResponse.json(
      {
        submission,
        meta: {
          auth: "anonymous",
          duplicateCheck: fuzzyMatch ? "fuzzy-flagged" : "none",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("store-submission.create failed", error);
    return NextResponse.json(
      { error: "Failed to create store submission. Check database configuration." },
      { status: 500 },
    );
  }
}
