import { NextRequest, NextResponse } from "next/server";

import { getStores } from "@/lib/directory-data";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePriceTier(value: string | null) {
  if (value === "BUDGET" || value === "MID" || value === "PREMIUM") {
    return value;
  }

  return undefined;
}

function parsePriceTiers(values: string[]) {
  return values
    .map((value) => parsePriceTier(value))
    .filter((value): value is "BUDGET" | "MID" | "PREMIUM" => Boolean(value));
}

function parseSort(value: string | null) {
  if (value === "name_asc" || value === "name_desc" || value === "city_asc" || value === "city_desc") {
    return value;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const result = await getStores({
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    categories: searchParams.getAll("category"),
    priceTiers: parsePriceTiers(searchParams.getAll("priceTier")),
    sort: parseSort(searchParams.get("sort")),
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
