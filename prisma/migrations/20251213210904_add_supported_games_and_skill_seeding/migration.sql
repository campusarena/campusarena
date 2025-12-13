-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "seedBySkill" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportedGameId" INTEGER;

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_key_key" ON "Game"("key");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_supportedGameId_fkey" FOREIGN KEY ("supportedGameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
