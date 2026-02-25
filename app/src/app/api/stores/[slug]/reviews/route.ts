import { NextResponse } from "next/server";

import { getStoreBySlug } from "@/lib/directory-data";

type RouteParams = {
  params: {
    slug: string;
  };
};

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

  return NextResponse.json({
    reviews: [],
    meta: {
      source: store.source,
      storeId: store.item.id,
      storeSlug: store.item.slug,
      count: 0,
      averageRating: null,
      placeholder: true,
    },
  });
}
