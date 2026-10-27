-- Se conserva el historial de migraciones ya aplicadas. Solo se retiran las estimaciones.
DROP TABLE "ImpactEntry";
ALTER TABLE "Listing" DROP COLUMN "impactMaterial";
ALTER TABLE "Listing" DROP COLUMN "paperSheets";
ALTER TABLE "Listing" DROP COLUMN "weightGrams";
