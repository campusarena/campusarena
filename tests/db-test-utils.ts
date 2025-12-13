import { PrismaClient, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

const PLAYER_EMAIL = 'player1@campusarena.test';
const SEEDED_TOURNAMENT_ID = 1;

export async function resetPlayer1UpcomingMatch(): Promise<{ matchId: number }> {
  const player = await prisma.user.findUnique({ where: { email: PLAYER_EMAIL } });
  if (!player) throw new Error(`Missing seeded user: ${PLAYER_EMAIL}`);

  const participant = await prisma.participant.findFirst({
    where: { tournamentId: SEEDED_TOURNAMENT_ID, userId: player.id },
  });
  if (!participant) {
    throw new Error(
      `Missing seeded participant for ${PLAYER_EMAIL} in tournament ${SEEDED_TOURNAMENT_ID}`,
    );
  }

  const matches = await prisma.match.findMany({
    where: { tournamentId: SEEDED_TOURNAMENT_ID },
    orderBy: [{ roundNumber: 'asc' }, { slotIndex: 'asc' }],
  });

  if (matches.length === 0) {
    throw new Error(`Missing seeded matches for tournament ${SEEDED_TOURNAMENT_ID}`);
  }

  // We want player1's first-round match (both participants assigned).
  const semiMatch = matches.find(
    (m) =>
      m.roundNumber === 1 &&
      m.p1Id != null &&
      m.p2Id != null &&
      (m.p1Id === participant.id || m.p2Id === participant.id),
  );

  if (!semiMatch) {
    throw new Error(
      `Missing seeded round-1 match for ${PLAYER_EMAIL} in tournament ${SEEDED_TOURNAMENT_ID}`,
    );
  }

  // Clear reports + reset match state for the entire tournament so prior runs
  // can't advance a winner into the final (creating a Player vs TBD matchup).
  await prisma.matchReport.deleteMany({
    where: { matchId: { in: matches.map((m) => m.id) } },
  });

  await prisma.match.updateMany({
    where: { id: { in: matches.map((m) => m.id) } },
    data: {
      status: MatchStatus.PENDING,
      p1Score: null,
      p2Score: null,
      winnerId: null,
      completedAt: null,
    },
  });

  const finalMatch = matches.find((m) => m.roundNumber === 2);
  if (finalMatch) {
    await prisma.match.update({
      where: { id: finalMatch.id },
      data: { p1Id: null, p2Id: null },
    });
  }

  return { matchId: semiMatch.id };
}

export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}
