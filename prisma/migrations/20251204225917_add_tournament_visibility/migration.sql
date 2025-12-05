-- CreateEnum
CREATE TYPE "TournamentVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "visibility" "TournamentVisibility" NOT NULL DEFAULT 'PRIVATE';
