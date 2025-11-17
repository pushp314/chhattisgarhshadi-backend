/*
  Warnings:

  - You are about to drop the column `accountHolderName` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `accountNumber` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `branchName` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledChequeUrl` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `commissionOn` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `commissionType` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `commissionValue` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `ifscCode` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `paidCommission` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `pendingCommission` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `tierBonus` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `tierLevel` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `tierTarget` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `totalCommission` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `totalRevenue` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `upiId` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the `agent_activity_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `agent_commissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `agent_payouts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agent_activity_logs" DROP CONSTRAINT "agent_activity_logs_agentId_fkey";

-- DropForeignKey
ALTER TABLE "agent_commissions" DROP CONSTRAINT "agent_commissions_agentId_fkey";

-- DropForeignKey
ALTER TABLE "agent_commissions" DROP CONSTRAINT "agent_commissions_payoutBatchId_fkey";

-- DropForeignKey
ALTER TABLE "agent_payouts" DROP CONSTRAINT "agent_payouts_agentId_fkey";

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "accountHolderName",
DROP COLUMN "accountNumber",
DROP COLUMN "bankName",
DROP COLUMN "branchName",
DROP COLUMN "cancelledChequeUrl",
DROP COLUMN "commissionOn",
DROP COLUMN "commissionType",
DROP COLUMN "commissionValue",
DROP COLUMN "ifscCode",
DROP COLUMN "paidCommission",
DROP COLUMN "pendingCommission",
DROP COLUMN "tierBonus",
DROP COLUMN "tierLevel",
DROP COLUMN "tierTarget",
DROP COLUMN "totalCommission",
DROP COLUMN "totalRevenue",
DROP COLUMN "upiId";

-- DropTable
DROP TABLE "agent_activity_logs";

-- DropTable
DROP TABLE "agent_commissions";

-- DropTable
DROP TABLE "agent_payouts";
