import { PrismaClient } from "@prisma/client";
import { seedCategories, seedStores } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  for (const category of seedCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: category,
    });
  }

  for (const store of seedStores) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: {
        name: store.name,
        description: store.description,
        street1: store.street1,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        phone: store.phone,
        websiteUrl: store.websiteUrl,
        latitude: store.latitude,
        longitude: store.longitude,
        priceTier: store.priceTier,
        status: "ACTIVE",
        source: store.source,
        sourceId: store.sourceId,
        categories: {
          deleteMany: {},
          create: store.categorySlugs.map((categorySlug) => ({
            assignedBy: "seed",
            category: { connect: { slug: categorySlug } },
          })),
        },
      },
      create: {
        name: store.name,
        slug: store.slug,
        description: store.description,
        street1: store.street1,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        phone: store.phone,
        websiteUrl: store.websiteUrl,
        latitude: store.latitude,
        longitude: store.longitude,
        priceTier: store.priceTier,
        status: "ACTIVE",
        source: store.source,
        sourceId: store.sourceId,
        categories: {
          create: store.categorySlugs.map((categorySlug) => ({
            assignedBy: "seed",
            category: { connect: { slug: categorySlug } },
          })),
        },
      },
    });
  }

  console.log(`Seeded ${seedCategories.length} categories and ${seedStores.length} stores`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
