import { prisma } from '@/lib/prisma';
import { MatchSlot, MatchStatus } from '@prisma/client';

function normalizeSlot(slot: MatchSlot | null | undefined): MatchSlot | null {
  if (!slot) return null;
  return slot;
}

async function hasInboundForSlot(matchId: number, slot: MatchSlot) {
  const feederWinner = await prisma.match.findFirst({
    where: { nextMatchId: matchId, nextMatchSlot: slot },
    select: { id: true },
  });
  if (feederWinner) return true;

  const feederLoser = await prisma.match.findFirst({
    where: { loserNextMatchId: matchId, loserNextMatchSlot: slot },
    select: { id: true },
  });
  return !!feederLoser;
}

async function applyToSlot(matchId: number, slot: MatchSlot, participantId: number) {
  await prisma.match.update({
    where: { id: matchId },
    data: slot === MatchSlot.P1 ? { p1Id: participantId } : { p2Id: participantId },
  });
}

async function autoAdvanceIfTrueBye(matchId: number, visited: Set<number>) {
  if (visited.has(matchId)) return;
  visited.add(matchId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      p1Id: true,
      p2Id: true,
      winnerId: true,
      completedAt: true,
      nextMatchId: true,
      nextMatchSlot: true,
      loserNextMatchId: true,
      loserNextMatchSlot: true,
    },
  });

  if (!match) return;
  if (match.status === MatchStatus.VERIFIED || match.status === MatchStatus.COMPLETE) return;

  const p1 = match.p1Id;
  const p2 = match.p2Id;

  const hasExactlyOne = (p1 != null && p2 == null) || (p2 != null && p1 == null);
  if (!hasExactlyOne) return;

  const winnerId = (p1 ?? p2) as number;
  const missingSlot = p1 == null ? MatchSlot.P1 : MatchSlot.P2;

  const inboundExists = await hasInboundForSlot(match.id, missingSlot);
  if (inboundExists) {
    // Not a true bye (the missing slot can still be filled later).
    return;
  }

  const now = new Date();

  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: MatchStatus.VERIFIED,
      winnerId,
      completedAt: now,
    },
  });

  // Only propagate the winner; a bye has no loser.
  if (match.nextMatchId) {
    const slot = normalizeSlot(match.nextMatchSlot);
    if (slot) {
      await applyToSlot(match.nextMatchId, slot, winnerId);
      await autoAdvanceIfTrueBye(match.nextMatchId, visited);
    }
  }

  // Do NOT propagate loserNextMatch for byes.
  // Still, downstream matches might now be true byes; allow a best-effort check.
  if (match.loserNextMatchId) {
    await autoAdvanceIfTrueBye(match.loserNextMatchId, visited);
  }
}

export async function autoAdvanceByesFromMatchIds(matchIds: number[]) {
  const visited = new Set<number>();
  for (const id of matchIds) {
    await autoAdvanceIfTrueBye(id, visited);
  }
}

export async function autoAdvanceTournamentByes(tournamentId: number) {
  const candidates = await prisma.match.findMany({
    where: {
      tournamentId,
      status: MatchStatus.PENDING,
      OR: [
        { p1Id: { not: null }, p2Id: null },
        { p1Id: null, p2Id: { not: null } },
      ],
    },
    select: { id: true },
  });

  await autoAdvanceByesFromMatchIds(candidates.map((m) => m.id));
}
