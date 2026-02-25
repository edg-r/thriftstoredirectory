import { NextResponse } from "next/server";

import { getCategories } from "@/lib/directory-data";

export async function GET() {
  const result = await getCategories();

  return NextResponse.json({
    categories: result.items,
    meta: {
      source: result.source,
      count: result.items.length,
    },
  });
}
