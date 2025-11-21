import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/authOptions';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      type,
      format,
      startDate,
      endDate,
      numberOfPlayers,
      isPublic,
      owner,
    } = body;

    const event = await prisma.event.create({
      data: {
        name,
        description,
        type,
        format,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        numberOfPlayers: parseInt(numberOfPlayers, 10),
        isPublic: Boolean(isPublic),
        owner,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}
