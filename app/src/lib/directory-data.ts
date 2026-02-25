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
  category?: string;
  priceTier?: "BUDGET" | "MID" | "PREMIUM";
  sort?: "name_asc" | "name_desc" | "city_asc" | "city_desc";
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

export type StoreDetailItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  phone: string | null;
  websiteUrl: string | null;
  priceTier: "BUDGET" | "MID" | "PREMIUM" | null;
  latitude: number | null;
  longitude: number | null;
  categoryNames: string[];
};

function mapCategoryNames(categorySlugs: string[]) {
  return categorySlugs
    .map((slug) => seedCategories.find((category) => category.slug === slug)?.name)
    .filter((value): value is string => Boolean(value));
}

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
  const category = query.category?.trim();
  const priceTier = query.priceTier;
  const sort = query.sort ?? "city_asc";
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
      ...(category
        ? {
            categories: {
              some: {
                category: { slug: category },
              },
            },
          }
        : {}),
      ...(priceTier ? { priceTier } : {}),
    };

    const orderBy: Prisma.StoreOrderByWithRelationInput[] =
      sort === "name_asc"
        ? [{ name: "asc" }]
        : sort === "name_desc"
          ? [{ name: "desc" }]
          : sort === "city_desc"
            ? [{ city: "desc" }, { name: "asc" }]
            : [{ city: "asc" }, { name: "asc" }];

    const [total, stores] = await Promise.all([
      prisma.store.count({ where }),
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
        id: store.id,
        name: store.name,
        slug: store.slug,
        city: store.city,
        state: store.state,
        street1: store.street1,
        postalCode: store.postalCode,
        priceTier: store.priceTier,
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
      const categoryMatches = !category || store.categorySlugs.includes(category);
      const priceTierMatches = !priceTier || store.priceTier === priceTier;

      return qMatches && cityMatches && categoryMatches && priceTierMatches;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      if (sort === "city_desc") {
        const cityCompare = b.city.localeCompare(a.city);
        return cityCompare !== 0 ? cityCompare : a.name.localeCompare(b.name);
      }
      const cityCompare = a.city.localeCompare(b.city);
      return cityCompare !== 0 ? cityCompare : a.name.localeCompare(b.name);
    });

    const items = sorted.slice(skip, skip + limit).map((store, index) => ({
      id: `seed-store-${skip + index + 1}`,
      name: store.name,
      slug: store.slug,
      city: store.city,
      state: store.state,
      street1: store.street1,
      postalCode: store.postalCode ?? null,
      priceTier: store.priceTier ?? null,
      categoryNames: mapCategoryNames(store.categorySlugs),
    }));

    return {
      items,
      page,
      limit,
      total: sorted.length,
      hasMore: skip + items.length < sorted.length,
      source: "fallback",
    };
  }
}

export async function getStoreBySlug(slug: string): Promise<{
  item: StoreDetailItem | null;
  source: "database" | "fallback";
}> {
  try {
    const store = await prisma.store.findFirst({
      where: {
        slug,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        street1: true,
        street2: true,
        city: true,
        state: true,
        postalCode: true,
        phone: true,
        websiteUrl: true,
        priceTier: true,
        latitude: true,
        longitude: true,
        categories: {
          select: {
            category: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!store) {
      return { item: null, source: "database" };
    }

    return {
      source: "database",
      item: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        street1: store.street1,
        street2: store.street2,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        phone: store.phone,
        websiteUrl: store.websiteUrl,
        priceTier: store.priceTier,
        latitude: store.latitude ? Number(store.latitude) : null,
        longitude: store.longitude ? Number(store.longitude) : null,
        categoryNames: store.categories.map((item) => item.category.name),
      },
    };
  } catch {
    const store = seedStores.find((candidate) => candidate.slug === slug);
    if (!store) {
      return { item: null, source: "fallback" };
    }

    return {
      source: "fallback",
      item: {
        id: `seed-store-${store.slug}`,
        name: store.name,
        slug: store.slug,
        description: store.description ?? null,
        street1: store.street1,
        street2: null,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode ?? null,
        phone: store.phone ?? null,
        websiteUrl: store.websiteUrl ?? null,
        priceTier: store.priceTier ?? null,
        latitude: store.latitude ?? null,
        longitude: store.longitude ?? null,
        categoryNames: mapCategoryNames(store.categorySlugs),
      },
    };
  }
}
