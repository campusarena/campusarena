import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all matches where user is a participant
    const userParticipants = await prisma.participant.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          {
            team: {
              members: {
                some: {
                  userId: currentUser.id,
                },
              },
            },
          },
        ],
      },
    });

    const participantIds = userParticipants.map(p => p.id);

    // Get all matches for these participants
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { p1Id: { in: participantIds } },
          { p2Id: { in: participantIds } },
        ],
      },
      include: {
        p1: {
          include: {
            user: true,
            team: true,
          },
        },
        p2: {
          include: {
            user: true,
            team: true,
          },
        },
        tournament: {
          select: {
            name: true,
          },
        },
        winner: {
          include: {
            user: true,
            team: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { scheduledAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 50, // Limit to 50 most recent matches
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
