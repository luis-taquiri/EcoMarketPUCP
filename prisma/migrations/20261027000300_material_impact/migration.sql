ALTER TABLE "Listing" ADD COLUMN "impactMaterial" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "Listing" ADD COLUMN "paperSheets" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "weightGrams" INTEGER;

CREATE TABLE "ImpactEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "weightGrams" REAL NOT NULL,
    "paperSheets" INTEGER NOT NULL,
    "factorKgCo2PerKg" REAL NOT NULL,
    "co2Grams" INTEGER NOT NULL,
    "methodVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImpactEntry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ImpactEntry_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ImpactEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ImpactEntry_listingId_key" ON "ImpactEntry"("listingId");
CREATE INDEX "ImpactEntry_userId_createdAt_idx" ON "ImpactEntry"("userId", "createdAt");
CREATE INDEX "ImpactEntry_tradeId_idx" ON "ImpactEntry"("tradeId");
