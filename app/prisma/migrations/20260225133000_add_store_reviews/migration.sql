-- CreateTable
CREATE TABLE "StoreReview" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "reviewerName" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "sourceFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreReview_storeId_createdAt_idx" ON "StoreReview"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "StoreReview_sourceFingerprint_createdAt_idx" ON "StoreReview"("sourceFingerprint", "createdAt");

-- AddForeignKey
ALTER TABLE "StoreReview" ADD CONSTRAINT "StoreReview_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
