import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { EventRole, MatchStatus, Prisma, Role, ReportStatus } from '@prisma/client';

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isLeftChild(slotIndex: number | null): boolean {
  return ((slotIndex ?? 1) % 2) === 1;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      matchId?: unknown;
      p1Score?: unknown;
      p2Score?: unknown;
    };

    const matchId = Number(body.matchId);
    const p1Score = body.p1Score;
    const p2Score = body.p2Score;

    if (!Number.isFinite(matchId) || !isNonNegativeInteger(p1Score) || !isNonNegativeInteger(p2Score)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    if (p1Score === p2Score) {
      return NextResponse.json({ error: 'Scores cannot be tied' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Explicitly disallow admins from editing match results.
    if (user.role === Role.ADMIN) {
      return NextResponse.json({ error: 'Organizer or owner access required' }, { status: 403 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        tournamentId: true,
        p1Id: true,
        p2Id: true,
        winnerId: true,
        slotIndex: true,
        nextMatchId: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.p1Id || !match.p2Id) {
      return NextResponse.json(
        { error: 'Both participants must be assigned to edit this match' },
        { status: 400 },
      );
    }

    const organizerRole = await prisma.eventRoleAssignment.findFirst({
      where: {
        tournamentId: match.tournamentId,
        userId: user.id,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
      select: { id: true },
    });

    if (!organizerRole) {
      return NextResponse.json({ error: 'Organizer or owner access required' }, { status: 403 });
    }

    const winnerParticipantId = p1Score > p2Score ? match.p1Id : match.p2Id;
    const now = new Date();
    const previousWinnerId = match.winnerId;

    await prisma.$transaction(async (tx) => {
      await tx.matchReport.create({
        data: {
          matchId: match.id,
          reportedById: user.id,
          p1Score,
          p2Score,
          winnerParticipantId,
          status: ReportStatus.APPROVED,
          reviewedAt: now,
          reviewedByRoleId: organizerRole.id,
        },
      });

      await tx.match.update({
        where: { id: match.id },
        data: {
          p1Score,
          p2Score,
          winnerId: winnerParticipantId,
          status: MatchStatus.VERIFIED,
          completedAt: now,
        },
      });

      // If winner didn't change, there's no bracket dependency change.
      if (previousWinnerId === winnerParticipantId) {
        return;
      }

      await cascadeUndoFromEditedMatch({
        tx,
        reviewerRoleId: organizerRole.id,
        now,
        start: {
          slotIndex: match.slotIndex,
          nextMatchId: match.nextMatchId,
          winnerId: winnerParticipantId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Edit match score error:', error);
    return NextResponse.json({ error: 'Failed to edit match score' }, { status: 500 });
  }
}

async function cascadeUndoFromEditedMatch({
  tx,
  reviewerRoleId,
  now,
  start,
}: {
  tx: Prisma.TransactionClient;
  reviewerRoleId: number;
  now: Date;
  start: { slotIndex: number | null; nextMatchId: number | null; winnerId: number | null };
}) {
  let childSlotIndex = start.slotIndex;
  let childNextMatchId = start.nextMatchId;
  let winnerToPropagate = start.winnerId;
  let canPropagateWinner = true;

  while (childNextMatchId) {
    const parent = await tx.match.findUnique({
      where: { id: childNextMatchId },
      select: {
        id: true,
        slotIndex: true,
        nextMatchId: true,
        winnerId: true,
        p1Score: true,
        p2Score: true,
        completedAt: true,
        status: true,
      },
    });

    if (!parent) return;

    const slotField = isLeftChild(childSlotIndex) ? 'p1Id' : 'p2Id';
    const slotValue = canPropagateWinner ? winnerToPropagate : null;

    await tx.match.update({
      where: { id: parent.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { [slotField]: slotValue } as any,
    });

    const parentHasResult =
      parent.winnerId !== null ||
      parent.p1Score !== null ||
      parent.p2Score !== null ||
      parent.completedAt !== null ||
      parent.status !== MatchStatus.PENDING;

    if (!parentHasResult) {
      return;
    }

    await tx.match.update({
      where: { id: parent.id },
      data: {
        winnerId: null,
        p1Score: null,
        p2Score: null,
        completedAt: null,
        scheduledAt: null,
        status: MatchStatus.PENDING,
      },
    });

    await tx.matchReport.updateMany({
      where: {
        matchId: parent.id,
        status: { not: ReportStatus.REJECTED },
      },
      data: {
        status: ReportStatus.REJECTED,
        reviewedAt: now,
        reviewedByRoleId: reviewerRoleId,
      },
    });

    // From this point on, the winner is unknown, so we can only clear
    // downstream slots and invalidate any downstream results.
    childSlotIndex = parent.slotIndex;
    childNextMatchId = parent.nextMatchId;
    winnerToPropagate = null;
    canPropagateWinner = false;
  }
}
