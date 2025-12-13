import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

const INVITE_EXPIRY_DAYS = 7;
const INVITE_EXPIRY_MS = INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

function isInvitationExpired(createdAt: Date): boolean {
  return Date.now() > createdAt.getTime() + INVITE_EXPIRY_MS;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userWithId = session?.user as { id?: string | number; email?: string | null } | undefined;
  const userIdRaw = userWithId?.id;

  if (!session?.user?.email || userIdRaw == null) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number(userIdRaw);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { token?: unknown; name?: unknown };
    const token = String(body.token ?? '').trim();
    const name = String(body.name ?? '').trim();

    if (!token || !name) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tournament: {
          select: { id: true, isTeamBased: true, status: true, maxParticipants: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid join token' }, { status: 404 });
    }

    if (invitation.tournament.status === 'completed') {
      return NextResponse.json({ success: false, error: 'This event is completed.' }, { status: 400 });
    }

    if (!invitation.tournament.isTeamBased) {
      return NextResponse.json({ success: false, error: 'This event is not team-based.' }, { status: 400 });
    }

    if (isInvitationExpired(invitation.createdAt)) {
      return NextResponse.json({ success: false, error: 'This join token has expired.' }, { status: 400 });
    }

    const maxTeams = invitation.tournament.maxParticipants;
    const currentTeams = await prisma.team.count({
      where: { tournamentId: invitation.tournamentId },
    });

    if (maxTeams != null && currentTeams >= maxTeams) {
      return NextResponse.json({ success: false, error: 'Team slots are full.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Ensure user isn't in another team for this tournament.
      await tx.teamMember.deleteMany({
        where: { userId, team: { tournamentId: invitation.tournamentId } },
      });

      const createdTeam = await tx.team.create({
        data: {
          tournamentId: invitation.tournamentId,
          name,
        },
        select: { id: true },
      });

      await tx.teamMember.create({
        data: { userId, teamId: createdTeam.id, isCaptain: true },
      });

      const maxSeedRow = await tx.participant.findFirst({
        where: { tournamentId: invitation.tournamentId },
        orderBy: { seed: 'desc' },
        select: { seed: true },
      });

      const nextSeed = (maxSeedRow?.seed ?? 0) + 1;

      await tx.participant.create({
        data: {
          tournamentId: invitation.tournamentId,
          teamId: createdTeam.id,
          seed: nextSeed,
        },
      });

      await tx.invitation.update({
        where: { token },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true, tournamentId: invitation.tournamentId });
  } catch (err: unknown) {
    // Prisma unique constraint for team name per tournament
    const e = err as { code?: string };
    if (e.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A team with that name already exists.' },
        { status: 400 },
      );
    }

    console.error('Create team error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create team' }, { status: 500 });
  }
}
