import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type ActionPayload = {
  action?: unknown;
  reviewerNotes?: unknown;
  duplicateOfStoreId?: unknown;
};

function asOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string) {
  const baseSlug = base || "thrift-store";
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.store.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

async function parseBody(request: NextRequest): Promise<ActionPayload> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as ActionPayload;
  }
  return {};
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseBody(request);
  const action = asOptionalString(body.action);
  const reviewerNotes = asOptionalString(body.reviewerNotes);
  const duplicateOfStoreId = asOptionalString(body.duplicateOfStoreId);

  if (!action || !["approve", "reject", "merge_duplicate"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Expected approve | reject | merge_duplicate" },
      { status: 400 },
    );
  }

  try {
    const submission = await prisma.storeSubmission.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        duplicateOfStoreId: true,
        proposedName: true,
        proposedStreet1: true,
        proposedStreet2: true,
        proposedCity: true,
        proposedState: true,
        proposedPostalCode: true,
        proposedPhone: true,
        proposedWebsiteUrl: true,
        proposedLatitude: true,
        proposedLongitude: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status !== "PENDING") {
      return NextResponse.json(
        { error: `Submission is already ${submission.status}` },
        { status: 409 },
      );
    }

    if (action === "reject") {
      const updated = await prisma.storeSubmission.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          reviewerNotes,
          reviewedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          reviewerNotes: true,
          reviewedAt: true,
        },
      });

      return NextResponse.json({ submission: updated, meta: { action } });
    }

    if (action === "merge_duplicate") {
      const targetStoreId = duplicateOfStoreId ?? submission.duplicateOfStoreId;
      if (!targetStoreId) {
        return NextResponse.json(
          { error: "duplicateOfStoreId is required for merge_duplicate" },
          { status: 400 },
        );
      }

      const targetStore = await prisma.store.findUnique({
        where: { id: targetStoreId },
        select: { id: true, slug: true, name: true },
      });

      if (!targetStore) {
        return NextResponse.json({ error: "Target duplicate store not found" }, { status: 404 });
      }

      const updated = await prisma.storeSubmission.update({
        where: { id: params.id },
        data: {
          status: "MERGED_DUPLICATE",
          duplicateOfStoreId: targetStore.id,
          reviewerNotes,
          reviewedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          duplicateOfStoreId: true,
          reviewerNotes: true,
          reviewedAt: true,
        },
      });

      return NextResponse.json({
        submission: updated,
        duplicateOfStore: targetStore,
        meta: { action },
      });
    }

    const baseSlug = slugify(`${submission.proposedName}-${submission.proposedCity}`);
    const slug = await uniqueSlug(baseSlug);

    const result = await prisma.$transaction(async (tx) => {
      const createdStore = await tx.store.create({
        data: {
          name: submission.proposedName,
          slug,
          street1: submission.proposedStreet1,
          street2: submission.proposedStreet2,
          city: submission.proposedCity,
          state: submission.proposedState,
          postalCode: submission.proposedPostalCode,
          phone: submission.proposedPhone,
          websiteUrl: submission.proposedWebsiteUrl,
          latitude: submission.proposedLatitude,
          longitude: submission.proposedLongitude,
          status: "ACTIVE",
          isUserSubmitted: true,
          source: "user_submission",
          sourceId: submission.id,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          state: true,
        },
      });

      const updatedSubmission = await tx.storeSubmission.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          approvedStoreId: createdStore.id,
          reviewerNotes,
          reviewedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          approvedStoreId: true,
          reviewerNotes: true,
          reviewedAt: true,
        },
      });

      return { createdStore, updatedSubmission };
    });

    return NextResponse.json({
      submission: result.updatedSubmission,
      approvedStore: result.createdStore,
      meta: { action },
    });
  } catch (error) {
    console.error("admin.store-submissions.patch failed", error);
    return NextResponse.json({ error: "Failed to update store submission" }, { status: 500 });
  }
}
