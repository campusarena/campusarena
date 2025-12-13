'use server';

import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function checkInToTournament(tournamentId: number) {
  const session = await getServerSession(authOptions);
  const userWithId = session?.user as { id?: string | number } | undefined;
  const userIdStr = userWithId?.id;

  if (!userIdStr) {
    return { ok: false as const, error: 'You must be signed in to check in.' };
  }

  const userId = Number(userIdStr);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { isTeamBased: true },
  });

  if (!tournament) {
    return { ok: false as const, error: 'Event not found.' };
  }

  const participant = await prisma.participant.findFirst({
    where: tournament.isTeamBased
      ? {
          tournamentId,
          team: {
            members: {
              some: { userId },
            },
          },
        }
      : { tournamentId, userId },
  });

  if (!participant) {
    return {
      ok: false as const,
      error: 'You are not registered for this event.',
    };
  }

  if (participant.checkedIn) {
    return { ok: true as const };
  }

  await prisma.participant.update({
    where: { id: participant.id },
    data: { checkedIn: true },
  });

  return { ok: true as const };
}
