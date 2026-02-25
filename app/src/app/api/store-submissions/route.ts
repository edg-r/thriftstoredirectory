import { NextRequest, NextResponse } from "next/server";

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

  const fieldErrors: Record<string, string> = {};

  if (!name) fieldErrors.name = "Name is required";
  if (!street1) fieldErrors.street1 = "Street address is required";
  if (!city) fieldErrors.city = "City is required";
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    fieldErrors.websiteUrl = "Website URL must start with http:// or https://";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
  }

  try {
    const normalizedName = normalizeForComparison(name);
    const normalizedStreet = normalizeForComparison(street1);
    const normalizedCity = normalizeForComparison(city);

    const duplicate = await prisma.store.findFirst({
      where: {
        status: "ACTIVE",
        city: { equals: city, mode: "insensitive" },
        OR: [
          { slug: normalizeForComparison(name).replace(/\s+/g, "-") },
          {
            AND: [
              { name: { equals: name, mode: "insensitive" } },
              { street1: { equals: street1, mode: "insensitive" } },
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
          meta: { duplicateCheck: "exact-name-address-or-slug", placeholder: true },
        },
        { status: 409 },
      );
    }

    const fuzzyCandidates = await prisma.store.findMany({
      where: {
        status: "ACTIVE",
        city: { equals: city, mode: "insensitive" },
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
        proposedName: name,
        proposedStreet1: street1,
        proposedStreet2: street2,
        proposedCity: city,
        proposedState: state,
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
          placeholderAuth: true,
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
