// src/lib/eventActions.ts
'use server';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { EventFormat, EventRole, Role } from '@prisma/client';
import { regenerateDoubleElimBracket, regenerateSingleElimBracket } from '@/lib/bracketService';

const ALLOWED_TOURNAMENT_STATUSES = new Set(['upcoming', 'ongoing', 'completed'] as const);
type AllowedTournamentStatus = 'upcoming' | 'ongoing' | 'completed';

function normalizeTournamentStatus(raw: unknown): AllowedTournamentStatus | null {
  const value = String(raw ?? '').trim().toLowerCase();

  // Back-compat / convenience: allow "complete" but store "completed".
  if (value === 'complete') return 'completed';

  if (ALLOWED_TOURNAMENT_STATUSES.has(value as AllowedTournamentStatus)) {
    return value as AllowedTournamentStatus;
  }

  return null;
}

export async function createTournamentAction(formData: FormData) {
  const session = await getServerSession(authOptions);

  // Narrow the type so TS knows about `id`
  const userWithId = session?.user as { id?: string | number } | undefined;
  const userIdStr = userWithId?.id;

  if (!userIdStr) {
    throw new Error('You must be signed in to create an event.');
  }

  const userId = Number(userIdStr);

  const name = String(formData.get('name') ?? '').trim();
  const customGame = String(formData.get('game') ?? '').trim();
  const supportedGameIdRaw = String(formData.get('supportedGameId') ?? '').trim();
  const seedBySkill = formData.get('seedBySkill') === 'on';
  const location = String(formData.get('location') ?? '').trim();

  const isTeamBasedRaw = String(formData.get('isTeamBased') ?? 'team');
  const isTeamBased = isTeamBasedRaw === 'team';

  const maxParticipantsRaw = formData.get('maxParticipants');
  const maxParticipants =
    maxParticipantsRaw && String(maxParticipantsRaw).length > 0
      ? Number(maxParticipantsRaw)
      : null;

  // New: read date and time separately
  const startDateRaw = String(formData.get('startDate') ?? '').trim();
  const startTimeRaw = String(formData.get('startTime') ?? '').trim();

  let startDate: Date;

  if (startDateRaw) {
    if (startTimeRaw) {
      // Combine local date and time into one ISO style string
      // Browser sends "HH:MM" so this is safe
      startDate = new Date(`${startDateRaw}T${startTimeRaw}`);
    } else {
      // If no time, default to midnight
      startDate = new Date(`${startDateRaw}T00:00`);
    }

    // Fallback in case the string is invalid
    if (Number.isNaN(startDate.getTime())) {
      startDate = new Date();
    }
  } else {
    // If no date at all, default to now
    startDate = new Date();
  }

  const visibilityRaw = formData.get('visibility') as string | null;
  const visibility =
    visibilityRaw === 'PRIVATE'
      ? visibilityRaw
      : 'PUBLIC';

  const autoBracketRaw = formData.get('autoBracket') as string | null;
  const autoBracket = autoBracketRaw === 'on';

  const formatRaw = String(formData.get('format') ?? '').trim();
  const format =
    formatRaw === EventFormat.DOUBLE_ELIM
      ? EventFormat.DOUBLE_ELIM
      : EventFormat.SINGLE_ELIM;

  if (!name) {
    throw new Error('Event name is required.');
  }

  let game: string;
  let supportedGameId: number | null = null;

  if (seedBySkill) {
    if (!supportedGameIdRaw) {
      throw new Error('Skill-based seeding requires selecting a supported game.');
    }
    if (customGame) {
      throw new Error('Choose either a supported game or a custom game (not both).');
    }

    const parsedId = Number(supportedGameIdRaw);
    if (!parsedId || Number.isNaN(parsedId)) {
      throw new Error('Invalid supported game selection.');
    }

    const supportedGame = await prisma.game.findFirst({
      where: { id: parsedId, active: true },
      select: { id: true, name: true },
    });

    if (!supportedGame) {
      throw new Error('Selected supported game was not found.');
    }

    supportedGameId = supportedGame.id;
    game = supportedGame.name;
  } else {
    if (supportedGameIdRaw) {
      throw new Error('Choose either a supported game or a custom game (not both).');
    }
    if (!customGame) {
      throw new Error('Game / sport is required.');
    }
    game = customGame;
  }

  const tournament = await prisma.tournament.create({
    data: {
      name,
      game,
      supportedGameId,
      seedBySkill,
      format,
      isTeamBased,
      startDate,
      status: 'upcoming',
      maxParticipants,
      location: location || null,
      visibility,
      autoBracket,
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
    if (tournament.format === EventFormat.DOUBLE_ELIM) {
      await regenerateDoubleElimBracket(tournament.id);
    } else {
      await regenerateSingleElimBracket(tournament.id);
    }
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

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { format: true },
  });

  if (!tournament) {
    return;
  }

  if (tournament.format === EventFormat.DOUBLE_ELIM) {
    await regenerateDoubleElimBracket(tournamentId);
  } else {
    await regenerateSingleElimBracket(tournamentId);
  }
  redirect(`/events/${tournamentId}`);
}

export async function updateTournamentStatusAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userWithId = session?.user as { id?: string | number } | undefined;
  const userIdRaw = userWithId?.id;

  if (userIdRaw == null) {
    return;
  }

  const userId = typeof userIdRaw === 'string' ? Number(userIdRaw) : userIdRaw;
  if (!userId || Number.isNaN(userId)) {
    return;
  }

  const tournamentIdRaw = formData.get('tournamentId');
  const tournamentId = Number(tournamentIdRaw);
  if (!tournamentId || Number.isNaN(tournamentId)) {
    return;
  }

  const nextStatus = normalizeTournamentStatus(formData.get('status'));
  if (!nextStatus) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return;
  }

  if (user.role !== Role.ADMIN) {
    const role = await prisma.eventRoleAssignment.findFirst({
      where: {
        tournamentId,
        userId,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });

    if (!role) {
      return;
    }
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: nextStatus },
  });

  redirect(`/events/${tournamentId}`);
}
