export const seedCategories = [
  { slug: "vintage-clothes", name: "Vintage Clothes", sortOrder: 10 },
  { slug: "furniture", name: "Furniture", sortOrder: 20 },
  { slug: "accessories", name: "Accessories", sortOrder: 30 },
  { slug: "shoes", name: "Shoes", sortOrder: 40 },
  { slug: "home-goods", name: "Home Goods", sortOrder: 50 },
  { slug: "books", name: "Books", sortOrder: 60 },
  { slug: "electronics", name: "Electronics", sortOrder: 70 },
  { slug: "designer-items", name: "Designer Items", sortOrder: 80 },
] as const;

export type SeedStore = {
  name: string;
  slug: string;
  street1: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  websiteUrl?: string;
  description?: string;
  categorySlugs: string[];
  priceTier?: "BUDGET" | "MID" | "PREMIUM";
  latitude?: number;
  longitude?: number;
  source?: string;
  sourceId?: string;
};

export const seedStores: SeedStore[] = [
  {
    name: "The Salvation Army Family Store & Donation Center",
    slug: "salvation-army-family-store-kearny-mesa",
    street1: "5155 Mercury Point",
    city: "San Diego",
    state: "CA",
    postalCode: "92111",
    phone: "(619) 688-3010",
    websiteUrl: "https://satruck.org/",
    description: "Large thrift floor with furniture, clothing, and household items.",
    categorySlugs: ["furniture", "home-goods", "electronics", "accessories"],
    priceTier: "BUDGET",
    latitude: 32.8276,
    longitude: -117.1513,
    source: "curated_seed",
    sourceId: "seed-001",
  },
  {
    name: "DAV Thrift Store",
    slug: "dav-thrift-store-san-diego",
    street1: "3755 Sports Arena Blvd",
    city: "San Diego",
    state: "CA",
    postalCode: "92110",
    phone: "(619) 297-4213",
    description: "Community thrift shop known for rotating inventory and broad selection.",
    categorySlugs: ["home-goods", "furniture", "books", "electronics"],
    priceTier: "BUDGET",
    latitude: 32.7558,
    longitude: -117.2107,
    source: "curated_seed",
    sourceId: "seed-002",
  },
  {
    name: "Amvets Thrift Store",
    slug: "amvets-thrift-store-oceanside",
    street1: "999 N Coast Hwy",
    city: "Oceanside",
    state: "CA",
    postalCode: "92054",
    phone: "(760) 722-2520",
    description: "Popular North County stop for apparel, books, and household goods.",
    categorySlugs: ["vintage-clothes", "accessories", "books", "home-goods"],
    priceTier: "BUDGET",
    latitude: 33.2074,
    longitude: -117.3858,
    source: "curated_seed",
    sourceId: "seed-003",
  },
  {
    name: "Consignment Classics",
    slug: "consignment-classics-point-loma",
    street1: "3619 Midway Dr",
    city: "San Diego",
    state: "CA",
    postalCode: "92110",
    phone: "(619) 297-1904",
    websiteUrl: "https://www.consignmentclassics.net/",
    description: "Large consignment/thrift style showroom for vintage furniture and decor.",
    categorySlugs: ["furniture", "home-goods", "accessories", "designer-items"],
    priceTier: "MID",
    latitude: 32.7571,
    longitude: -117.2126,
    source: "curated_seed",
    sourceId: "seed-004",
  },
];
