import { NextResponse } from "next/server";

import { getStoreBySlug } from "@/lib/directory-data";

type RouteParams = {
  params: {
    slug: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const result = await getStoreBySlug(params.slug);

  if (!result.item) {
    return NextResponse.json(
      {
        error: "Store not found",
        meta: { source: result.source },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    store: result.item,
    meta: { source: result.source },
  });
}
