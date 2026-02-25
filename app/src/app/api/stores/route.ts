import { NextRequest, NextResponse } from "next/server";

import { getStores } from "@/lib/directory-data";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const result = await getStores({
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    page: parsePositiveInt(searchParams.get("page"), 1),
    limit: parsePositiveInt(searchParams.get("limit"), 12),
  });

  return NextResponse.json({
    stores: result.items,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      hasMore: result.hasMore,
      source: result.source,
    },
  });
}
