/*
  Warnings:

  - You are about to drop the column `awayScore` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `awayTeamId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `homeScore` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `homeTeamId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `matchNumber` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `round` on the `Match` table. All the data in the column will be lost.
  - The `status` column on the `Match` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `seed` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `maxTeams` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the `Stuff` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tournamentId,name]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('SINGLE_ELIM');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'SCHEDULED', 'REPORTED', 'VERIFIED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('OWNER', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_awayTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_homeTeamId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "awayScore",
DROP COLUMN "awayTeamId",
DROP COLUMN "homeScore",
DROP COLUMN "homeTeamId",
DROP COLUMN "matchNumber",
DROP COLUMN "round",
ADD COLUMN     "location" TEXT,
ADD COLUMN     "nextMatchId" INTEGER,
ADD COLUMN     "p1Id" INTEGER,
ADD COLUMN     "p1Score" INTEGER,
ADD COLUMN     "p2Id" INTEGER,
ADD COLUMN     "p2Score" INTEGER,
ADD COLUMN     "roundNumber" INTEGER,
ADD COLUMN     "slotIndex" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "seed",
ADD COLUMN     "tag" TEXT;

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "maxTeams",
ADD COLUMN     "format" "EventFormat" NOT NULL DEFAULT 'SINGLE_ELIM',
ADD COLUMN     "isTeamBased" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "maxParticipants" INTEGER;

-- DropTable
DROP TABLE "Stuff";

-- DropEnum
DROP TYPE "Condition";

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER,
    "teamId" INTEGER,
    "seed" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRoleAssignment" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "EventRole" NOT NULL,

    CONSTRAINT "EventRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchReport" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "reportedById" INTEGER NOT NULL,
    "p1Score" INTEGER NOT NULL,
    "p2Score" INTEGER NOT NULL,
    "winnerParticipantId" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByRoleId" INTEGER,

    CONSTRAINT "MatchReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "Participant_tournamentId_idx" ON "Participant"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRoleAssignment_tournamentId_userId_role_key" ON "EventRoleAssignment"("tournamentId", "userId", "role");

-- CreateIndex
CREATE INDEX "Match_tournamentId_roundNumber_idx" ON "Match"("tournamentId", "roundNumber");

-- CreateIndex
CREATE INDEX "Match_tournamentId_status_idx" ON "Match"("tournamentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Team_tournamentId_name_key" ON "Team"("tournamentId", "name");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRoleAssignment" ADD CONSTRAINT "EventRoleAssignment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRoleAssignment" ADD CONSTRAINT "EventRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_p1Id_fkey" FOREIGN KEY ("p1Id") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_p2Id_fkey" FOREIGN KEY ("p2Id") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_reviewedByRoleId_fkey" FOREIGN KEY ("reviewedByRoleId") REFERENCES "EventRoleAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
