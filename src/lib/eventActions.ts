// src/lib/eventActions.ts
'use server';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { EventFormat, EventRole } from '@prisma/client';
import { regenerateSingleElimBracket } from '@/lib/bracketService';

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

  const autoBracketRaw = formData.get('autoBracket') as string | null;
  const autoBracket = autoBracketRaw === 'on';

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
      // For now, store this flag on status string extension via metadata field later
    },
  });

  await prisma.eventRoleAssignment.create({
    data: {
      tournamentId: tournament.id,
      userId,
      role: EventRole.OWNER,
    },
  });

  if (autoBracket) {
    await regenerateSingleElimBracket(tournament.id);
  }

  redirect('/dashboard');
}

export async function regenerateBracketAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userWithId = session?.user as { id?: string | number } | undefined;
  const userIdStr = userWithId?.id;

  if (!userIdStr) {
    // Silently ignore; UI already hides the button when not authorized.
    return;
  }

  const userId = Number(userIdStr);
  const tournamentIdRaw = formData.get('tournamentId');
  if (!tournamentIdRaw) {
    return;
  }
  const tournamentId = Number(tournamentIdRaw);

  const role = await prisma.eventRoleAssignment.findFirst({
    where: {
      tournamentId,
      userId,
      role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
    },
  });

  if (!role) {
    // Not authorized; do nothing so there is no thrown error.
    return;
  }

  await regenerateSingleElimBracket(tournamentId);
  redirect(`/events/${tournamentId}`);
}

