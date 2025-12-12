/*
  Warnings:

  - You are about to drop the column `bloodGroup` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bodyType` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `complexion` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `familyStatus` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "bloodGroup",
DROP COLUMN "bodyType",
DROP COLUMN "complexion",
DROP COLUMN "familyStatus";

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "tableName" VARCHAR(100) NOT NULL,
    "recordId" INTEGER NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "changedFields" TEXT,
    "changedBy" INTEGER,
    "changedByType" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "ipAddress" INET,
    "userAgent" TEXT,
    "requestId" VARCHAR(50),
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_metrics" (
    "id" SERIAL NOT NULL,
    "metricName" VARCHAR(100) NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "metricUnit" VARCHAR(20) NOT NULL,
    "tableName" VARCHAR(100),
    "queryType" VARCHAR(20),
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "database_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "searchFilters" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "executionTimeMs" INTEGER NOT NULL,
    "searchType" VARCHAR(50) NOT NULL,
    "platform" VARCHAR(20) NOT NULL DEFAULT 'MOBILE',
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_rate_limit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "ipAddress" INET NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "limitHitCount" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "contactRequests" INTEGER NOT NULL DEFAULT 0,
    "interestsSent" INTEGER NOT NULL DEFAULT 0,
    "messagesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_boosts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "boostType" VARCHAR(50) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL,
    "transactionId" VARCHAR(100),
    "activatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_logs_changedBy_idx" ON "audit_logs"("changedBy");

-- CreateIndex
CREATE INDEX "audit_logs_changedAt_idx" ON "audit_logs"("changedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_changedAt_idx" ON "audit_logs"("tableName", "changedAt" DESC);

-- CreateIndex
CREATE INDEX "database_metrics_metricName_recordedAt_idx" ON "database_metrics"("metricName", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "database_metrics_tableName_idx" ON "database_metrics"("tableName");

-- CreateIndex
CREATE INDEX "search_logs_userId_idx" ON "search_logs"("userId");

-- CreateIndex
CREATE INDEX "search_logs_searchedAt_idx" ON "search_logs"("searchedAt" DESC);

-- CreateIndex
CREATE INDEX "search_logs_searchType_searchedAt_idx" ON "search_logs"("searchType", "searchedAt" DESC);

-- CreateIndex
CREATE INDEX "search_logs_executionTimeMs_idx" ON "search_logs"("executionTimeMs" DESC);

-- CreateIndex
CREATE INDEX "api_rate_limit_logs_userId_createdAt_idx" ON "api_rate_limit_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "api_rate_limit_logs_ipAddress_createdAt_idx" ON "api_rate_limit_logs"("ipAddress", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "api_rate_limit_logs_endpoint_idx" ON "api_rate_limit_logs"("endpoint");

-- CreateIndex
CREATE INDEX "daily_usage_userId_idx" ON "daily_usage"("userId");

-- CreateIndex
CREATE INDEX "daily_usage_date_idx" ON "daily_usage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_userId_date_key" ON "daily_usage"("userId", "date");

-- CreateIndex
CREATE INDEX "profile_boosts_userId_idx" ON "profile_boosts"("userId");

-- CreateIndex
CREATE INDEX "profile_boosts_status_expiresAt_idx" ON "profile_boosts"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "profile_boosts_boostType_idx" ON "profile_boosts"("boostType");
