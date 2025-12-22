/*
  Warnings:

  - You are about to drop the column `nativeDistrict` on the `partner_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `nativeDistrict` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `nativeTehsil` on the `profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "profiles_nativeDistrict_idx";

-- AlterTable
ALTER TABLE "partner_preferences" DROP COLUMN "nativeDistrict";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "nativeDistrict",
DROP COLUMN "nativeTehsil",
ADD COLUMN     "category" VARCHAR(100);

-- CreateIndex
CREATE INDEX "profiles_nativeVillage_idx" ON "profiles"("nativeVillage");
