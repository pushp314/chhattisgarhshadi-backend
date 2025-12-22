/*
  Warnings:

  - You are about to drop the column `attachmentType` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `deletedBy` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `messages` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');

-- DropIndex
DROP INDEX "messages_createdAt_idx";

-- DropIndex
DROP INDEX "messages_receiverId_isRead_idx";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "attachmentType",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedBy",
DROP COLUMN "isDeleted",
DROP COLUMN "isRead",
ADD COLUMN     "attachmentMime" VARCHAR(100),
ADD COLUMN     "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "conversationId" INTEGER,
ADD COLUMN     "isDeletedByReceiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeletedBySender" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "userAId" INTEGER NOT NULL,
    "userBId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_userAId_idx" ON "conversations"("userAId");

-- CreateIndex
CREATE INDEX "conversations_userBId_idx" ON "conversations"("userBId");

-- CreateIndex
CREATE INDEX "conversations_updatedAt_idx" ON "conversations"("updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_userAId_userBId_key" ON "conversations"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
