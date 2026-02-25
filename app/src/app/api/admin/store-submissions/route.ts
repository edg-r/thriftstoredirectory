import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStatus(value: string | null) {
  if (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "MERGED_DUPLICATE"
  ) {
    return value;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  const authError = requireAdminApiAccess(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get("status")) ?? "PENDING";
  const limit = Math.min(100, parsePositiveInt(searchParams.get("limit"), 25));

  try {
    const submissions = await prisma.storeSubmission.findMany({
      where: { status },
      orderBy: [{ createdAt: "asc" }],
      take: limit,
      select: {
        id: true,
        status: true,
        proposedName: true,
        proposedStreet1: true,
        proposedCity: true,
        proposedState: true,
        proposedPostalCode: true,
        proposedPhone: true,
        proposedWebsiteUrl: true,
        notes: true,
        duplicateOfStoreId: true,
        approvedStoreId: true,
        reviewerNotes: true,
        reviewedAt: true,
        createdAt: true,
        duplicateOfStore: {
          select: { id: true, slug: true, name: true, city: true },
        },
        approvedStore: {
          select: { id: true, slug: true, name: true, city: true },
        },
      },
    });

    return NextResponse.json({
      submissions,
      meta: {
        status,
        count: submissions.length,
        limit,
        auth: "admin-key",
      },
    });
  } catch (error) {
    console.error("admin.store-submissions.list failed", error);
    return NextResponse.json({ error: "Failed to load store submissions" }, { status: 500 });
  }
}
