import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/authOptions';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId, p1Score, p2Score, winnerSide } = await request.json();

    // Validate input (allow 0 scores, require explicit winnerSide)
    if (
      matchId == null ||
      typeof p1Score !== 'number' ||
      typeof p2Score !== 'number' ||
      (winnerSide !== 'P1' && winnerSide !== 'P2')
    ) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    // Get the match to verify it exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        p1: true,
        p2: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if match is already verified
    if (match.status === 'VERIFIED') {
      return NextResponse.json({ error: 'Match already verified' }, { status: 400 });
    }

    if (!match.p1Id || !match.p2Id) {
      return NextResponse.json({ error: 'Match does not have both participants assigned' }, { status: 400 });
    }

    // winnerSide comes from the client as which side won: 'P1' or 'P2'.
    let winnerParticipantId: number;
    if (winnerSide === 'P1') {
      winnerParticipantId = match.p1Id;
    } else if (winnerSide === 'P2') {
      winnerParticipantId = match.p2Id;
    } else {
      return NextResponse.json({ error: 'Invalid winner side' }, { status: 400 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create match report
    const report = await prisma.matchReport.create({
      data: {
        matchId,
        reportedById: user.id,
        p1Score,
        p2Score,
        winnerParticipantId,
        status: 'PENDING',
      },
    });

    // Update match status to REPORTED
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'REPORTED',
        p1Score,
        p2Score,
      },
    });

    return NextResponse.json({ 
      success: true, 
      report,
      message: 'Match result submitted successfully. Waiting for verification.' 
    });

  } catch (error) {
    console.error('Error submitting match report:', error);
    return NextResponse.json({ error: 'Failed to submit match report' }, { status: 500 });
  }
}
