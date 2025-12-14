import { prisma } from '@/lib/prisma';
import { BracketSide, MatchSlot, MatchStatus } from '@prisma/client';
import { autoAdvanceTournamentByes } from '@/lib/byeService';

function nextPowerOfTwo(n: number) {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

async function applySkillSeedingIfNeeded(tournamentId: number): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { seedBySkill: true, supportedGameId: true, isTeamBased: true },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (!tournament.seedBySkill || !tournament.supportedGameId) return;
  if (tournament.isTeamBased) return;

  const participants = await prisma.participant.findMany({
    where: { tournamentId, checkedIn: true, userId: { not: null } },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });

  if (participants.length === 0) return;

  const userIds = participants
    .map((p) => p.userId)
    .filter((id): id is number => typeof id === 'number');

  if (userIds.length === 0) return;

  const ratings = await prisma.playerGameRating.findMany({
    where: {
      gameId: tournament.supportedGameId,
      userId: { in: userIds },
    },
    select: { userId: true, rating: true, gamesPlayed: true },
  });

  const ratingByUserId = new Map<number, { rating: number; gamesPlayed: number }>();
  for (const r of ratings) {
    ratingByUserId.set(r.userId, { rating: r.rating, gamesPlayed: r.gamesPlayed });
  }

  const ranked = participants
    .map((p) => {
      const meta = ratingByUserId.get(p.userId!);
      return {
        participantId: p.id,
        userName: p.user?.name ?? '',
        rating: meta?.rating ?? 1500,
        gamesPlayed: meta?.gamesPlayed ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      const byName = a.userName.localeCompare(b.userName);
      if (byName !== 0) return byName;
      return a.participantId - b.participantId;
    });

  await prisma.$transaction(
    ranked.map((r, index) =>
      prisma.participant.update({
        where: { id: r.participantId },
        data: { seed: index + 1 },
      }),
    ),
  );
}

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

  await applySkillSeedingIfNeeded(tournamentId);

  const participants = await prisma.participant.findMany({
    where: { tournamentId, checkedIn: true },
    orderBy: [{ seed: 'asc' }, { id: 'asc' }],
  });

  if (participants.length === 0) {
    throw new Error('No checked-in participants to seed into the bracket');
  }

  // Delete existing matches for this tournament so we can regenerate
  await prisma.match.deleteMany({ where: { tournamentId } });

  const N = participants.length;
  const bracketSize = nextPowerOfTwo(N);
  const byeCount = bracketSize - N;

  const rounds: { p1Id: number | null; p2Id: number | null }[][] = [];

  // Build first round pairings with byes: top seeds get byes.
  const firstRound: { p1Id: number | null; p2Id: number | null }[] = [];
  const firstRoundMatchCount = bracketSize / 2;
  let idx = 0;

  for (let m = 0; m < byeCount; m += 1) {
    const p1 = participants[idx++];
    firstRound.push({ p1Id: p1?.id ?? null, p2Id: null });
  }

  while (firstRound.length < firstRoundMatchCount) {
    const p1 = participants[idx++];
    const p2 = participants[idx++];
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
          bracket: BracketSide.WINNERS,
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
      const nextMatchSlot = i % 2 === 0 ? MatchSlot.P1 : MatchSlot.P2;

      await prisma.match.update({
        where: { id: current[i] },
        data: { nextMatchId: parentId, nextMatchSlot },
      });
    }
  }

  // Auto-advance true byes (matches with only one participant and no inbound).
  await autoAdvanceTournamentByes(tournamentId);
}

export async function regenerateDoubleElimBracket(tournamentId: number) {
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

  await applySkillSeedingIfNeeded(tournamentId);

  const participants = await prisma.participant.findMany({
    where: { tournamentId, checkedIn: true },
    orderBy: [{ seed: 'asc' }, { id: 'asc' }],
  });

  if (participants.length < 2) {
    throw new Error('Not enough checked-in participants to seed into the bracket');
  }

  const N = participants.length;
  const bracketSize = nextPowerOfTwo(N);

  // Delete existing matches for this tournament so we can regenerate
  await prisma.match.deleteMany({ where: { tournamentId } });

  const winnersIds: number[][] = [];
  const winnersRound1IsBye: boolean[] = [];

  // Winners Round 1 (with byes): top seeds get byes.
  const w1Ids: number[] = [];
  const firstRoundMatchCount = bracketSize / 2;
  const byeCount = bracketSize - N;
  let idx = 0;

  for (let m = 0; m < firstRoundMatchCount; m += 1) {
    const isBye = m < byeCount;
    const p1 = participants[idx++];
    const p2 = isBye ? undefined : participants[idx++];
    const match = await prisma.match.create({
      data: {
        tournamentId,
        bracket: BracketSide.WINNERS,
        roundNumber: 1,
        slotIndex: m + 1,
        p1Id: p1?.id ?? undefined,
        p2Id: p2?.id ?? undefined,
        status: MatchStatus.PENDING,
      },
    });
    w1Ids.push(match.id);
    winnersRound1IsBye.push(isBye);
  }
  winnersIds.push(w1Ids);

  // Remaining winners rounds
  let roundMatchCount = w1Ids.length;
  let winnersRoundNumber = 1;
  while (roundMatchCount > 1) {
    winnersRoundNumber += 1;
    roundMatchCount = Math.floor(roundMatchCount / 2);
    const ids: number[] = [];
    for (let i = 0; i < roundMatchCount; i += 1) {
      const match = await prisma.match.create({
        data: {
          tournamentId,
          bracket: BracketSide.WINNERS,
          roundNumber: winnersRoundNumber,
          slotIndex: i + 1,
          status: MatchStatus.PENDING,
        },
      });
      ids.push(match.id);
    }
    winnersIds.push(ids);
  }

  const k = winnersIds.length; // number of winners rounds

  // Create losers rounds: 2k-2 rounds
  const losersIds: number[][] = [];
  const losersRoundCount = 2 * k - 2;
  for (let lbRound = 1; lbRound <= losersRoundCount; lbRound += 1) {
    const r = Math.floor((lbRound + 1) / 2); // groups (1,2)->1; (3,4)->2...
    const matchCount = bracketSize / 2 ** (r + 1);
    const ids: number[] = [];
    for (let i = 0; i < matchCount; i += 1) {
      const match = await prisma.match.create({
        data: {
          tournamentId,
          bracket: BracketSide.LOSERS,
          roundNumber: lbRound,
          slotIndex: i + 1,
          status: MatchStatus.PENDING,
        },
      });
      ids.push(match.id);
    }
    losersIds.push(ids);
  }

  // Finals: grand finals match 1 & (potential) reset match 2
  const grandFinal1 = await prisma.match.create({
    data: {
      tournamentId,
      bracket: BracketSide.FINALS,
      roundNumber: 1,
      slotIndex: 1,
      status: MatchStatus.PENDING,
    },
  });
  const grandFinal2 = await prisma.match.create({
    data: {
      tournamentId,
      bracket: BracketSide.FINALS,
      roundNumber: 2,
      slotIndex: 1,
      status: MatchStatus.PENDING,
    },
  });

  // Wire winners bracket (winner advancement)
  for (let roundIndex = 0; roundIndex < winnersIds.length - 1; roundIndex += 1) {
    const current = winnersIds[roundIndex];
    const next = winnersIds[roundIndex + 1];
    for (let i = 0; i < current.length; i += 1) {
      const parentId = next[Math.floor(i / 2)];
      const nextMatchSlot = i % 2 === 0 ? MatchSlot.P1 : MatchSlot.P2;
      await prisma.match.update({
        where: { id: current[i] },
        data: { nextMatchId: parentId, nextMatchSlot },
      });
    }
  }

  // Wire losers from winners R1 -> losers R1 (fills P1/P2)
  for (let i = 0; i < winnersIds[0].length; i += 1) {
    if (winnersRound1IsBye[i]) {
      // Byes have no loser; do not create an inbound loser edge.
      continue;
    }
    const targetId = losersIds[0][Math.floor(i / 2)];
    const loserNextMatchSlot = i % 2 === 0 ? MatchSlot.P1 : MatchSlot.P2;
    await prisma.match.update({
      where: { id: winnersIds[0][i] },
      data: { loserNextMatchId: targetId, loserNextMatchSlot },
    });
  }

  // Wire losers from winners R2..Rk -> losers even rounds (always fill P2)
  for (let r = 2; r <= k; r += 1) {
    const winnersRoundIndex = r - 1;
    const lbRoundEven = 2 * r - 2;
    const lbIndex = lbRoundEven - 1;
    for (let i = 0; i < winnersIds[winnersRoundIndex].length; i += 1) {
      await prisma.match.update({
        where: { id: winnersIds[winnersRoundIndex][i] },
        data: { loserNextMatchId: losersIds[lbIndex][i], loserNextMatchSlot: MatchSlot.P2 },
      });
    }
  }

  // Wire losers bracket progression
  // For each r (1..k-1):
  //  - even round 2r: winners of odd round 2r-1 advance into P1
  //  - odd round (2r+1) gets winners of even round 2r (paired)
  for (let r = 1; r <= k - 1; r += 1) {
    const oddIndex = (2 * r - 1) - 1;
    const evenIndex = (2 * r) - 1;

    // odd -> even (same index), fill P1
    for (let i = 0; i < losersIds[oddIndex].length; i += 1) {
      await prisma.match.update({
        where: { id: losersIds[oddIndex][i] },
        data: { nextMatchId: losersIds[evenIndex][i], nextMatchSlot: MatchSlot.P1 },
      });
    }

    // even -> next odd (pair), except after last even round
    const nextOddRound = 2 * r + 1;
    if (nextOddRound <= losersRoundCount) {
      const nextOddIndex = nextOddRound - 1;
      for (let i = 0; i < losersIds[evenIndex].length; i += 1) {
        const parentId = losersIds[nextOddIndex][Math.floor(i / 2)];
        const nextMatchSlot = i % 2 === 0 ? MatchSlot.P1 : MatchSlot.P2;
        await prisma.match.update({
          where: { id: losersIds[evenIndex][i] },
          data: { nextMatchId: parentId, nextMatchSlot },
        });
      }
    }
  }

  // Winners bracket champ -> grand final 1 (P1)
  await prisma.match.update({
    where: { id: winnersIds[k - 1][0] },
    data: { nextMatchId: grandFinal1.id, nextMatchSlot: MatchSlot.P1 },
  });

  // Losers bracket champ (last losers round has 1 match) -> grand final 1 (P2)
  await prisma.match.update({
    where: { id: losersIds[losersIds.length - 1][0] },
    data: { nextMatchId: grandFinal1.id, nextMatchSlot: MatchSlot.P2 },
  });

  // Wire grand final 1 to grand final 2 (used only when bracket resets)
  await prisma.match.update({
    where: { id: grandFinal1.id },
    data: { nextMatchId: grandFinal2.id },
  });

  // Auto-advance true byes (including any downstream matches that have
  // an unfillable slot due to byes).
  await autoAdvanceTournamentByes(tournamentId);
}
