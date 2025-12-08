-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MatchStatus" ADD VALUE 'READY';
ALTER TYPE "MatchStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "MatchStatus" ADD VALUE 'COMPLETE';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "checkIn1" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkIn2" BOOLEAN NOT NULL DEFAULT false;
