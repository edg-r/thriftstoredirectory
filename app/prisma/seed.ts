import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "vintage-clothes", name: "Vintage Clothes", sortOrder: 10 },
  { slug: "furniture", name: "Furniture", sortOrder: 20 },
  { slug: "accessories", name: "Accessories", sortOrder: 30 },
  { slug: "shoes", name: "Shoes", sortOrder: 40 },
  { slug: "home-goods", name: "Home Goods", sortOrder: 50 },
  { slug: "books", name: "Books", sortOrder: 60 },
  { slug: "electronics", name: "Electronics", sortOrder: 70 },
  { slug: "designer-items", name: "Designer Items", sortOrder: 80 },
];

async function main() {
  for (const category of categories) {
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

  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
