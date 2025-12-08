import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { MatchStatus } from '@prisma/client';

/**
 * POST /api/match/start
 * Body: { matchId: number }
 * 
 * Starts a match by setting status to IN_PROGRESS.
 * Only allowed if current status is READY.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 }
      );
    }

    // Get the current match
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

    // Validation: Can only start if status is SCHEDULED
    if (match.status !== MatchStatus.SCHEDULED) {
      return NextResponse.json(
        { 
          error: `Cannot start match. Current status is ${match.status}. Match must be SCHEDULED to start.`,
          currentStatus: match.status,
          requiredStatus: 'SCHEDULED'
        },
        { status: 400 }
      );
    }

    // Update match to IN_PROGRESS
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.IN_PROGRESS },
      include: {
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Match started successfully',
      match: updatedMatch,
    });
  } catch (error) {
    console.error('Start match error:', error);
    return NextResponse.json(
      { error: 'Failed to start match' },
      { status: 500 }
    );
  }
}
