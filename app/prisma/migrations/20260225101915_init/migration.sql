-- CreateEnum
CREATE TYPE "PriceTier" AS ENUM ('BUDGET', 'MID', 'PREMIUM');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "StoreSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MERGED_DUPLICATE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "street1" TEXT NOT NULL,
    "street2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'CA',
    "postalCode" TEXT,
    "county" TEXT NOT NULL DEFAULT 'San Diego',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "phone" TEXT,
    "websiteUrl" TEXT,
    "hoursJson" JSONB,
    "priceTier" "PriceTier",
    "status" "StoreStatus" NOT NULL DEFAULT 'ACTIVE',
    "isUserSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreCategory" (
    "storeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreCategory_pkey" PRIMARY KEY ("storeId","categoryId")
);

-- CreateTable
CREATE TABLE "StoreSubmission" (
    "id" TEXT NOT NULL,
    "submittedByUserId" TEXT,
    "status" "StoreSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "proposedName" TEXT NOT NULL,
    "proposedStreet1" TEXT NOT NULL,
    "proposedStreet2" TEXT,
    "proposedCity" TEXT NOT NULL,
    "proposedState" TEXT NOT NULL DEFAULT 'CA',
    "proposedPostalCode" TEXT,
    "proposedLatitude" DECIMAL(9,6),
    "proposedLongitude" DECIMAL(9,6),
    "proposedPhone" TEXT,
    "proposedWebsiteUrl" TEXT,
    "proposedHoursJson" JSONB,
    "notes" TEXT,
    "duplicateOfStoreId" TEXT,
    "approvedStoreId" TEXT,
    "reviewerNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE INDEX "Store_city_state_idx" ON "Store"("city", "state");

-- CreateIndex
CREATE INDEX "Store_status_idx" ON "Store"("status");

-- CreateIndex
CREATE INDEX "Store_latitude_longitude_idx" ON "Store"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "Store_source_sourceId_key" ON "Store"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "StoreCategory_categoryId_storeId_idx" ON "StoreCategory"("categoryId", "storeId");

-- CreateIndex
CREATE INDEX "StoreSubmission_status_createdAt_idx" ON "StoreSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StoreSubmission_submittedByUserId_idx" ON "StoreSubmission"("submittedByUserId");

-- CreateIndex
CREATE INDEX "StoreSubmission_duplicateOfStoreId_idx" ON "StoreSubmission"("duplicateOfStoreId");

-- CreateIndex
CREATE INDEX "StoreSubmission_approvedStoreId_idx" ON "StoreSubmission"("approvedStoreId");

-- AddForeignKey
ALTER TABLE "StoreCategory" ADD CONSTRAINT "StoreCategory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCategory" ADD CONSTRAINT "StoreCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSubmission" ADD CONSTRAINT "StoreSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSubmission" ADD CONSTRAINT "StoreSubmission_duplicateOfStoreId_fkey" FOREIGN KEY ("duplicateOfStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSubmission" ADD CONSTRAINT "StoreSubmission_approvedStoreId_fkey" FOREIGN KEY ("approvedStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
