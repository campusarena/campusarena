-- CreateEnum
CREATE TYPE "MatchSlot" AS ENUM ('P1', 'P2');

-- CreateEnum
CREATE TYPE "BracketSide" AS ENUM ('WINNERS', 'LOSERS', 'FINALS');

-- AlterEnum
ALTER TYPE "EventFormat" ADD VALUE 'DOUBLE_ELIM';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "bracket" "BracketSide" NOT NULL DEFAULT 'WINNERS',
ADD COLUMN     "loserNextMatchId" INTEGER,
ADD COLUMN     "loserNextMatchSlot" "MatchSlot",
ADD COLUMN     "nextMatchSlot" "MatchSlot";

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_loserNextMatchId_fkey" FOREIGN KEY ("loserNextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
