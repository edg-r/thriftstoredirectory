import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { seedCategories, seedStores } from "@/lib/seed-data";

export type CategoryListItem = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export type StoreListItem = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  street1: string;
  postalCode: string | null;
  priceTier: "BUDGET" | "MID" | "PREMIUM" | null;
  categoryNames: string[];
};

export type StoreListQuery = {
  q?: string;
  city?: string;
  page?: number;
  limit?: number;
};

export type StoreListResult = {
  items: StoreListItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  source: "database" | "fallback";
};

export async function getCategories(): Promise<{
  items: CategoryListItem[];
  source: "database" | "fallback";
}> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, sortOrder: true },
    });

    return { items: categories, source: "database" };
  } catch {
    return {
      source: "fallback",
      items: seedCategories.map((category, index) => ({
        id: `seed-category-${index + 1}`,
        slug: category.slug,
        name: category.name,
        sortOrder: category.sortOrder,
      })),
    };
  }
}

export async function getStores(query: StoreListQuery = {}): Promise<StoreListResult> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 12));
  const q = query.q?.trim();
  const city = query.city?.trim();
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.StoreWhereInput = {
      status: "ACTIVE",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { street1: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    };

    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ city: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
          street1: true,
          postalCode: true,
          priceTier: true,
          categories: {
            select: {
              category: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: stores.map((store) => ({
        ...store,
        categoryNames: store.categories.map((item) => item.category.name),
      })),
      page,
      limit,
      total,
      hasMore: skip + stores.length < total,
      source: "database",
    };
  } catch {
    const filtered = seedStores.filter((store) => {
      const qMatches =
        !q ||
        [store.name, store.city, store.street1]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
      const cityMatches = !city || store.city.toLowerCase() === city.toLowerCase();

      return qMatches && cityMatches;
    });

    const items = filtered.slice(skip, skip + limit).map((store, index) => ({
      id: `seed-store-${skip + index + 1}`,
      name: store.name,
      slug: store.slug,
      city: store.city,
      state: store.state,
      street1: store.street1,
      postalCode: store.postalCode ?? null,
      priceTier: store.priceTier ?? null,
      categoryNames: store.categorySlugs
        .map((slug) => seedCategories.find((category) => category.slug === slug)?.name)
        .filter((value): value is string => Boolean(value)),
    }));

    return {
      items,
      page,
      limit,
      total: filtered.length,
      hasMore: skip + items.length < filtered.length,
      source: "fallback",
    };
  }
}
