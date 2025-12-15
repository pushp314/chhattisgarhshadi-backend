-- AlterTable
ALTER TABLE "partner_preferences" ADD COLUMN     "casteMandatory" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSeen" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pincodes" (
    "id" SERIAL NOT NULL,
    "pincode" VARCHAR(6) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pincodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pincodes_pincode_key" ON "pincodes"("pincode");

-- CreateIndex
CREATE INDEX "pincodes_pincode_idx" ON "pincodes"("pincode");
