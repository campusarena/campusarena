import { prisma } from '@/lib/prisma';
import { MatchStatus } from '@prisma/client';

export async function regenerateSingleElimBracket(tournamentId: number) {
  // Check if any matches are completed before regenerating
  const hasCompletedMatches = await prisma.match.findFirst({
    where: {
      tournamentId,
      OR: [
        { status: 'COMPLETE' },
        { status: 'VERIFIED' },
        { completedAt: { not: null } },
      ],
    },
  });

  if (hasCompletedMatches) {
    throw new Error('Cannot regenerate bracket after matches have been completed');
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        orderBy: { seed: 'asc' },
      },
    },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const participants = tournament.participants.filter((p) => p.checkedIn);
  if (participants.length === 0) {
    throw new Error('No checked-in participants to seed into the bracket');
  }

  // Delete existing matches for this tournament so we can regenerate
  await prisma.match.deleteMany({ where: { tournamentId } });

  const N = participants.length;
  const rounds: { p1Id: number | null; p2Id: number | null }[][] = [];

  // Build first round pairings from current participants.
  const firstRound: { p1Id: number | null; p2Id: number | null }[] = [];
  for (let i = 0; i < N; i += 2) {
    const p1 = participants[i];
    const p2 = participants[i + 1];
    firstRound.push({ p1Id: p1?.id ?? null, p2Id: p2?.id ?? null });
  }
  rounds.push(firstRound);

  // Subsequent rounds are initially empty slots wired via nextMatchId.
  let roundSize = firstRound.length;
  while (roundSize > 1) {
    const next: { p1Id: number | null; p2Id: number | null }[] = [];
    for (let i = 0; i < roundSize; i += 2) {
      next.push({ p1Id: null, p2Id: null });
    }
    rounds.push(next);
    roundSize = next.length;
  }

  // Create matches round by round and remember their ids to wire nextMatchId.
  const createdRoundIds: number[][] = [];

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
    const round = rounds[roundIndex];
    const matchIds: number[] = [];

    for (let slotIndex = 0; slotIndex < round.length; slotIndex += 1) {
      const pairing = round[slotIndex];

      const match = await prisma.match.create({
        data: {
          tournamentId,
          roundNumber: roundIndex + 1,
          slotIndex: slotIndex + 1,
          p1Id: pairing.p1Id ?? undefined,
          p2Id: pairing.p2Id ?? undefined,
          status: MatchStatus.PENDING,
        },
      });

      matchIds.push(match.id);
    }

    createdRoundIds.push(matchIds);
  }

  // Wire nextMatchId for all but the final round.
  for (let roundIndex = 0; roundIndex < createdRoundIds.length - 1; roundIndex += 1) {
    const current = createdRoundIds[roundIndex];
    const next = createdRoundIds[roundIndex + 1];

    for (let i = 0; i < current.length; i += 1) {
      const parentIndex = Math.floor(i / 2);
      const parentId = next[parentIndex];

      await prisma.match.update({
        where: { id: current[i] },
        data: { nextMatchId: parentId },
      });
    }
  }
}
