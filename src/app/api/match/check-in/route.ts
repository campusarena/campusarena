import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { MatchStatus } from '@prisma/client';

/**
 * POST /api/match/check-in
 * Body: { matchId: number, participantId: number }
 * 
 * Updates check-in status for a participant in a match.
 * If both participants check in, automatically sets status to READY.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, participantId } = body;

    if (!matchId || !participantId) {
      return NextResponse.json(
        { error: 'matchId and participantId are required' },
        { status: 400 }
      );
    }

    // Get the match with participant info
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Validation: Cannot check in if match is already IN_PROGRESS or COMPLETE
    if (match.status === MatchStatus.IN_PROGRESS || match.status === MatchStatus.COMPLETE) {
      return NextResponse.json(
        { error: `Cannot check in. Match is already ${match.status}` },
        { status: 400 }
      );
    }

    // Determine which participant is checking in
    const updateData: { checkIn1?: boolean; checkIn2?: boolean } = {};
    
    if (match.p1Id === participantId) {
      if (match.checkIn1) {
        return NextResponse.json(
          { error: 'Player 1 already checked in' },
          { status: 400 }
        );
      }
      updateData.checkIn1 = true;
    } else if (match.p2Id === participantId) {
      if (match.checkIn2) {
        return NextResponse.json(
          { error: 'Player 2 already checked in' },
          { status: 400 }
        );
      }
      updateData.checkIn2 = true;
    } else {
      return NextResponse.json(
        { error: 'Participant is not part of this match' },
        { status: 400 }
      );
    }

    // Update the check-in status
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
      },
    });

    // Check if both players are now checked in
    const bothCheckedIn = 
      (match.p1Id === participantId ? true : match.checkIn1) &&
      (match.p2Id === participantId ? true : match.checkIn2);

    // If both checked in and status is PENDING, update to READY
    if (bothCheckedIn && match.status === MatchStatus.PENDING) {
      const readyMatch = await prisma.match.update({
        where: { id: matchId },
        data: { status: MatchStatus.READY },
        include: {
          p1: { include: { user: true, team: true } },
          p2: { include: { user: true, team: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Both players checked in. Match is now READY!',
        match: readyMatch,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in successful. Waiting for other player.',
      match: updatedMatch,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    );
  }
}
