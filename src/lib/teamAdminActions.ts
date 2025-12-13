'use server';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { EventRole, MatchStatus, Prisma } from '@prisma/client';

function parseIntField(formData: FormData, name: string) {
  const raw = formData.get(name);
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(`Missing ${name}`);
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid ${name}`);
  }
  return n;
}

async function requireOrganizer(tournamentId: number) {
  const session = await getServerSession(authOptions);
  const typedUser = session?.user as { id?: string | number } | undefined;
  const currentUserId = typedUser?.id ? Number(typedUser.id) : null;

  if (!currentUserId) {
    redirect('/auth/signin');
  }

  const role = await prisma.eventRoleAssignment.findFirst({
    where: {
      tournamentId,
      userId: currentUserId,
      role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
    },
  });

  if (!role) {
    redirect('/not-authorized');
  }
}

async function requireTeamsEditable(tournamentId: number) {
  const startedMatchCount = await prisma.match.count({
    where: {
      tournamentId,
      OR: [
        { completedAt: { not: null } },
        { status: { in: [MatchStatus.IN_PROGRESS, MatchStatus.REPORTED, MatchStatus.VERIFIED, MatchStatus.COMPLETE] } },
      ],
    },
  });

  if (startedMatchCount > 0) {
    redirect(`/events/${tournamentId}/teams?locked=1`);
  }
}

async function detachParticipantsFromMatches(
  tx: Prisma.TransactionClient,
  participantIds: number[],
) {
  if (participantIds.length === 0) return;

  await tx.match.updateMany({
    where: { p1Id: { in: participantIds } },
    data: { p1Id: null, p1Score: null },
  });

  await tx.match.updateMany({
    where: { p2Id: { in: participantIds } },
    data: { p2Id: null, p2Score: null },
  });

  await tx.match.updateMany({
    where: { winnerId: { in: participantIds } },
    data: { winnerId: null },
  });
}

export async function deleteTeamAction(formData: FormData) {
  const tournamentId = parseIntField(formData, 'tournamentId');
  const teamId = parseIntField(formData, 'teamId');

  await requireOrganizer(tournamentId);
  await requireTeamsEditable(tournamentId);

  await prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      select: { id: true, tournamentId: true },
    });

    if (!team || team.tournamentId !== tournamentId) {
      throw new Error('Team not found.');
    }

    const participantIds = (
      await tx.participant.findMany({
        where: { tournamentId, teamId },
        select: { id: true },
      })
    ).map((p) => p.id);

    await detachParticipantsFromMatches(tx, participantIds);

    await tx.teamMember.deleteMany({ where: { teamId } });
    await tx.participant.deleteMany({ where: { tournamentId, teamId } });
    await tx.team.delete({ where: { id: teamId } });
  });

  revalidatePath(`/events/${tournamentId}`);
  revalidatePath(`/events/${tournamentId}/teams`);
  redirect(`/events/${tournamentId}/teams`);
}

export async function moveTeamMemberAction(formData: FormData) {
  const tournamentId = parseIntField(formData, 'tournamentId');
  const userId = parseIntField(formData, 'userId');
  const fromTeamId = parseIntField(formData, 'fromTeamId');
  const toTeamId = parseIntField(formData, 'toTeamId');

  await requireOrganizer(tournamentId);
  await requireTeamsEditable(tournamentId);

  if (fromTeamId === toTeamId) {
    redirect(`/events/${tournamentId}/teams`);
  }

  await prisma.$transaction(async (tx) => {
    const fromTeam = await tx.team.findUnique({
      where: { id: fromTeamId },
      select: { id: true, tournamentId: true },
    });
    const toTeam = await tx.team.findUnique({
      where: { id: toTeamId },
      select: { id: true, tournamentId: true },
    });

    if (!fromTeam || !toTeam || fromTeam.tournamentId !== tournamentId || toTeam.tournamentId !== tournamentId) {
      throw new Error('Invalid team selection.');
    }

    await tx.teamMember.deleteMany({
      where: {
        userId,
        team: { tournamentId },
      },
    });

    await tx.teamMember.create({
      data: {
        userId,
        teamId: toTeamId,
      },
    });
  });

  revalidatePath(`/events/${tournamentId}/teams`);
  redirect(`/events/${tournamentId}/teams`);
}
