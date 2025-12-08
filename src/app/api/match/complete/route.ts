import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { MatchStatus } from '@prisma/client';

/**
 * POST /api/match/complete
 * Body: { matchId: number, winnerId: number, p1Score?: number, p2Score?: number }
 * 
 * Completes a match by:
 * - Setting status to COMPLETE
 * - Recording the winner
 * - Recording scores (optional)
 * - Setting completedAt timestamp
 * 
 * Only allowed if current status is IN_PROGRESS.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, winnerId, p1Score, p2Score } = body;

    if (!matchId || !winnerId) {
      return NextResponse.json(
        { error: 'matchId and winnerId are required' },
        { status: 400 }
      );
    }

    // Get the current match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Validation: Can only complete if status is SCHEDULED
    if (match.status !== MatchStatus.SCHEDULED) {
      return NextResponse.json(
        { 
          error: `Cannot complete match. Current status is ${match.status}. Match must be SCHEDULED to complete.`,
          currentStatus: match.status,
          requiredStatus: 'SCHEDULED'
        },
        { status: 400 }
      );
    }

    // Validate winnerId is one of the participants
    if (winnerId !== match.p1Id && winnerId !== match.p2Id) {
      return NextResponse.json(
        { error: 'Winner must be one of the match participants' },
        { status: 400 }
      );
    }

    // Update match to COMPLETE with winner and scores
    const updateData: {
      status: MatchStatus;
      winnerId: number;
      completedAt: Date;
      p1Score?: number;
      p2Score?: number;
    } = {
      status: MatchStatus.VERIFIED,
      winnerId: winnerId,
      completedAt: new Date(),
    };

    if (p1Score !== undefined) updateData.p1Score = p1Score;
    if (p2Score !== undefined) updateData.p2Score = p2Score;

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
        winner: { include: { user: true, team: true } },
        tournament: true,
      },
    });

    // Optional: Advance winner to next match in bracket
    if (updatedMatch.nextMatchId) {
      await advanceWinnerToBracket(updatedMatch);
    }

    return NextResponse.json({
      success: true,
      message: 'Match completed successfully',
      match: updatedMatch,
    });
  } catch (error) {
    console.error('Complete match error:', error);
    return NextResponse.json(
      { error: 'Failed to complete match' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to advance winner to the next bracket match
 * This is a basic implementation - you may need to customize based on your bracket logic
 */
async function advanceWinnerToBracket(completedMatch: {
  nextMatchId: number | null;
  winnerId: number | null;
}) {
  if (!completedMatch.nextMatchId || !completedMatch.winnerId) {
    return;
  }

  try {
    const nextMatch = await prisma.match.findUnique({
      where: { id: completedMatch.nextMatchId },
    });

    if (!nextMatch) return;

    // Determine which slot the winner should fill in the next match
    // This is a simplified logic - adjust based on your bracket structure
    const updateData: { p1Id?: number; p2Id?: number } = {};
    
    if (!nextMatch.p1Id) {
      updateData.p1Id = completedMatch.winnerId;
    } else if (!nextMatch.p2Id) {
      updateData.p2Id = completedMatch.winnerId;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.match.update({
        where: { id: completedMatch.nextMatchId },
        data: updateData,
      });
    }
  } catch (error) {
    console.error('Error advancing winner to bracket:', error);
    // Don't throw - bracket advancement is optional
  }
}
