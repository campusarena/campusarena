import { PrismaClient, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

const PLAYER_EMAIL = 'player1@campusarena.test';
const SEEDED_TOURNAMENT_ID = 1;
const SEEDED_ELO_TOURNAMENT_ID = 6;

const ELO_PLAYERS: Array<{ email: string; seed: number }> = [
  { email: 'player1@campusarena.test', seed: 2 },
  { email: 'player2@campusarena.test', seed: 4 },
  { email: 'player3@campusarena.test', seed: 1 },
  { email: 'player4@campusarena.test', seed: 3 },
];

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

export async function resetEloSeededTournament(): Promise<void> {
  // Remove any generated bracket/match state for the Elo-seeded fixture.
  await prisma.matchReport.deleteMany({
    where: { match: { tournamentId: SEEDED_ELO_TOURNAMENT_ID } },
  });

  await prisma.match.deleteMany({
    where: { tournamentId: SEEDED_ELO_TOURNAMENT_ID },
  });

  // Restore the intentionally scrambled seeds so tests can verify that
  // regeneration applies ELO-based seeding.
  for (const row of ELO_PLAYERS) {
    const user = await prisma.user.findUnique({ where: { email: row.email }, select: { id: true } });
    if (!user) {
      throw new Error(`Missing seeded user for ELO tournament: ${row.email}`);
    }

    const participant = await prisma.participant.findFirst({
      where: { tournamentId: SEEDED_ELO_TOURNAMENT_ID, userId: user.id },
      select: { id: true },
    });

    if (!participant) {
      throw new Error(`Missing participant for ${row.email} in tournament ${SEEDED_ELO_TOURNAMENT_ID}`);
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: { seed: row.seed, checkedIn: true },
    });
  }
}

export async function getTournamentParticipantSeeds(tournamentId: number): Promise<Array<{ email: string; seed: number | null }>> {
  const participants = await prisma.participant.findMany({
    where: { tournamentId, userId: { not: null } },
    include: { user: { select: { email: true } } },
    orderBy: [{ seed: 'asc' }, { id: 'asc' }],
  });

  return participants.map((p) => ({
    email: p.user?.email ?? 'unknown',
    seed: p.seed,
  }));
}

export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}
