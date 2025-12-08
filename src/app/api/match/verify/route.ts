import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/authOptions';
import { EventRole } from '@prisma/client';

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

      // If this match feeds into a nextMatch, promote the winner into the
      // correct slot (p1 or p2) based on this match's slotIndex.
      if (report.match.nextMatchId) {
        const parent = await prisma.match.findUnique({
          where: { id: report.match.nextMatchId },
        });

        if (parent) {
          const isLeftChild = (report.match.slotIndex ?? 1) % 2 === 1;
          await prisma.match.update({
            where: { id: parent.id },
            data: isLeftChild
              ? { p1Id: updatedMatch.winnerId ?? undefined }
              : { p2Id: updatedMatch.winnerId ?? undefined },
          });
        }
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
