// src/lib/eventActions.ts
'use server';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { EventFormat, EventRole } from '@prisma/client';

export async function createTournamentAction(formData: FormData) {
  const session = await getServerSession(authOptions);

  // 👇 Narrow the type so TS knows about `id`
  const userWithId = session?.user as { id?: string | number } | undefined;
  const userIdStr = userWithId?.id;

  if (!userIdStr) {
    throw new Error('You must be signed in to create an event.');
  }

  const userId = Number(userIdStr);

  const name = String(formData.get('name') ?? '').trim();
  const game = String(formData.get('game') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();

  const isTeamBasedRaw = String(formData.get('isTeamBased') ?? 'team');
  const isTeamBased = isTeamBasedRaw === 'team';

  const maxParticipantsRaw = formData.get('maxParticipants');
  const maxParticipants =
    maxParticipantsRaw ? Number(maxParticipantsRaw) : null;

  const startDateRaw = formData.get('startDate');
  const startDate = startDateRaw
    ? new Date(String(startDateRaw))
    : new Date();

  const visibilityRaw = formData.get('visibility') as string | null;
  const visibility =
    visibilityRaw === 'PRIVATE'
      ? visibilityRaw
      : 'PUBLIC';

  if (!name || !game) {
    throw new Error('Event name and game are required.');
  }

  const tournament = await prisma.tournament.create({
    data: {
      name,
      game,
      format: EventFormat.SINGLE_ELIM,
      isTeamBased,
      startDate,
      status: 'upcoming',
      maxParticipants,
      location: location || null,
      visibility,
    },
  });

  await prisma.eventRoleAssignment.create({
    data: {
      tournamentId: tournament.id,
      userId,
      role: EventRole.OWNER,
    },
  });

  redirect('/dashboard');
}
