import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/authOptions';
import { EventRole } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only return pending reports for tournaments where this user is allowed to verify
    // (owner/organizer). This prevents "admin" from implicitly granting access to
    // unrelated events/matches.
    const reports = await prisma.matchReport.findMany({
      where: {
        status: 'PENDING',
        match: {
          tournament: {
            staff: {
              some: {
                userId: user.id,
                role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
              },
            },
          },
        },
      },
      include: {
        reportedBy: {
          select: {
            email: true,
            name: true,
          },
        },
        match: {
          include: {
            p1: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
                team: {
                  select: {
                    name: true,
                    members: {
                      select: {
                        user: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            p2: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
                team: {
                  select: {
                    name: true,
                    members: {
                      select: {
                        user: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('Error fetching pending reports:', error);
    return NextResponse.json({ error: 'Failed to fetch pending reports' }, { status: 500 });
  }
}
