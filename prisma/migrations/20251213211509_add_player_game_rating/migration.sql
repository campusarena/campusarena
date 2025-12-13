-- CreateTable
CREATE TABLE "PlayerGameRating" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1500,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerGameRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerGameRating_gameId_idx" ON "PlayerGameRating"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameRating_userId_gameId_key" ON "PlayerGameRating"("userId", "gameId");

-- AddForeignKey
ALTER TABLE "PlayerGameRating" ADD CONSTRAINT "PlayerGameRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameRating" ADD CONSTRAINT "PlayerGameRating_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
