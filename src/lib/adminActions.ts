'use server';

import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/authOptions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Prisma, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

type SessionLike = {
  user?: {
    email?: string | null;
    id?: string;
    randomKey?: string;
  };
} | null;

async function requireAdminSession() {
  const session = (await getServerSession(authOptions)) as unknown as SessionLike;
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  if (session.user.randomKey !== Role.ADMIN) {
    redirect('/not-authorized');
  }

  return session;
}

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

async function detachParticipantsFromMatches(
  tx: Prisma.TransactionClient,
  participantIds: number[]
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

export async function adminDeleteTournamentAction(formData: FormData) {
  await requireAdminSession();
  const tournamentId = parseIntField(formData, 'tournamentId');

  await prisma.tournament.delete({ where: { id: tournamentId } });

  revalidatePath('/admin');
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export async function adminKickUserFromTournamentAction(formData: FormData) {
  await requireAdminSession();
  const tournamentId = parseIntField(formData, 'tournamentId');
  const userId = parseIntField(formData, 'userId');

  await prisma.$transaction(async (tx) => {
    const participantIds = (
      await tx.participant.findMany({
        where: { tournamentId, userId },
        select: { id: true },
      })
    ).map((p) => p.id);

    await detachParticipantsFromMatches(tx, participantIds);

    await tx.eventRoleAssignment.deleteMany({ where: { tournamentId, userId } });

    await tx.teamMember.deleteMany({
      where: {
        userId,
        team: {
          tournamentId,
        },
      },
    });

    await tx.participant.deleteMany({ where: { tournamentId, userId } });
  });

  revalidatePath('/admin');
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${tournamentId}`);
  redirect(`/admin/events/${tournamentId}`);
}

export async function adminKickUserFromPlatformAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = parseIntField(formData, 'userId');

  const currentUserId = Number.parseInt(String(session?.user?.id ?? ''), 10);
  if (Number.isFinite(currentUserId) && currentUserId === userId) {
    throw new Error('Admins cannot remove themselves.');
  }

  await prisma.$transaction(async (tx) => {
    const participantIds = (
      await tx.participant.findMany({
        where: { userId },
        select: { id: true },
      })
    ).map((p) => p.id);

    await detachParticipantsFromMatches(tx, participantIds);

    const roleIds = (
      await tx.eventRoleAssignment.findMany({
        where: { userId },
        select: { id: true },
      })
    ).map((r) => r.id);

    if (roleIds.length > 0) {
      await tx.matchReport.updateMany({
        where: { reviewedByRoleId: { in: roleIds } },
        data: { reviewedByRoleId: null },
      });
    }

    await tx.matchReport.deleteMany({ where: { reportedById: userId } });

    await tx.invitation.deleteMany({
      where: {
        OR: [{ invitedById: userId }, { invitedUserId: userId }],
      },
    });

    await tx.eventRoleAssignment.deleteMany({ where: { userId } });
    await tx.teamMember.deleteMany({ where: { userId } });
    await tx.participant.deleteMany({ where: { userId } });

    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath('/admin');
  revalidatePath('/admin/users');
  redirect('/admin/users');
}
