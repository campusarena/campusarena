import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/authOptions';
import { EventRole, MatchSlot } from '@prisma/client';
import { autoAdvanceByesFromMatchIds } from '@/lib/byeService';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportId, action } = await request.json(); // action: 'approve' or 'reject'

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the report
    const report = await prisma.matchReport.findUnique({
      where: { id: reportId },
      include: {
        match: {
          include: {
            tournament: true,
            // We need nextMatch wiring and round/slot to know where to
            // promote the winner.
            nextMatch: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Only event owners/organizers for this tournament may verify/reject.
    const organizerRole = await prisma.eventRoleAssignment.findFirst({
      where: {
        tournamentId: report.match.tournamentId,
        userId: user.id,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });

    if (!organizerRole) {
      return NextResponse.json({ error: 'Organizer or owner access required' }, { status: 403 });
    }

    if (action === 'approve') {
      // Approve the report
      await prisma.matchReport.update({
        where: { id: reportId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedByRoleId: organizerRole.id,
        },
      });

      // Sanity check: winnerParticipantId must be one of the match participants
      if (!report.winnerParticipantId ||
          (report.winnerParticipantId !== report.match.p1Id &&
           report.winnerParticipantId !== report.match.p2Id)) {
        return NextResponse.json({
          error: 'Report winner does not match match participants',
        }, { status: 400 });
      }

      // Update match with final scores and status
      const updatedMatch = await prisma.match.update({
        where: { id: report.matchId },
        data: {
          p1Score: report.p1Score,
          p2Score: report.p2Score,
          winnerId: report.winnerParticipantId,
          status: 'VERIFIED',
          completedAt: new Date(),
        },
      });

      const applyToSlot = async (matchId: number, slot: MatchSlot, participantId: number) => {
        await prisma.match.update({
          where: { id: matchId },
          data: slot === MatchSlot.P1 ? { p1Id: participantId } : { p2Id: participantId },
        });
      };

      const winnerId = updatedMatch.winnerId;
      const loserId =
        winnerId && updatedMatch.p1Id && updatedMatch.p2Id
          ? (winnerId === updatedMatch.p1Id ? updatedMatch.p2Id : updatedMatch.p1Id)
          : null;

      const fallbackSlotFromIndex = (slotIndex: number | null | undefined) =>
        (slotIndex ?? 1) % 2 === 1 ? MatchSlot.P1 : MatchSlot.P2;

      // If this match feeds into a nextMatch, promote the winner into the
      // correct slot (p1 or p2) based on this match's slotIndex.
      if (report.match.nextMatchId && winnerId) {
        const slot = report.match.nextMatchSlot ?? fallbackSlotFromIndex(report.match.slotIndex);
        await applyToSlot(report.match.nextMatchId, slot, winnerId);
      }

      // If this match has loser routing (double elim), promote the loser too.
      if (report.match.loserNextMatchId && loserId) {
        const slot = report.match.loserNextMatchSlot ?? fallbackSlotFromIndex(report.match.slotIndex);
        await applyToSlot(report.match.loserNextMatchId, slot, loserId);
      }

      // If any downstream match is now a "true bye" (missing slot has no inbound
      // edges due to byes), auto-advance it.
      await autoAdvanceByesFromMatchIds(
        [report.match.nextMatchId, report.match.loserNextMatchId].filter(
          (id): id is number => typeof id === 'number',
        ),
      );

      // Grand Finals reset: if the Losers bracket champ wins GF1, schedule GF2
      // with the same two participants.
      if (
        report.match.bracket === 'FINALS' &&
        report.match.roundNumber === 1 &&
        report.match.nextMatchId &&
        updatedMatch.p1Id &&
        updatedMatch.p2Id &&
        winnerId === updatedMatch.p2Id
      ) {
        await prisma.match.update({
          where: { id: report.match.nextMatchId },
          data: {
            p1Id: updatedMatch.p1Id,
            p2Id: updatedMatch.p2Id,
            p1Score: null,
            p2Score: null,
            winnerId: null,
            completedAt: null,
            status: 'PENDING',
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Match result verified successfully' 
      });

    } else if (action === 'reject') {
      // Reject the report
      await prisma.matchReport.update({
        where: { id: reportId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
        },
      });

      // Set match back to pending
      await prisma.match.update({
        where: { id: report.matchId },
        data: {
          status: 'PENDING',
          p1Score: null,
          p2Score: null,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Match result rejected' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error verifying match report:', error);
    return NextResponse.json({ error: 'Failed to verify match report' }, { status: 500 });
  }
}
