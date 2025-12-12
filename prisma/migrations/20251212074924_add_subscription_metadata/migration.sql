/*
  Warnings:

  - A unique constraint covering the columns `[viewerId,profileId]` on the table `profile_views` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "discountPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountValidUntil" TIMESTAMP(3),
ADD COLUMN     "originalPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "metadata" TEXT;

-- CreateIndex
CREATE INDEX "messages_receiverId_status_idx" ON "messages"("receiverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "profile_views_viewerId_profileId_key" ON "profile_views"("viewerId", "profileId");

-- CreateIndex
CREATE INDEX "user_subscriptions_planId_idx" ON "user_subscriptions"("planId");
