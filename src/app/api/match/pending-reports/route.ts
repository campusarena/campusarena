import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import authOptions from '@/lib/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user and check if admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all pending reports
    const reports = await prisma.matchReport.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        reportedBy: {
          select: {
            email: true,
          },
        },
        match: {
          include: {
            p1: {
              include: {
                team: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            p2: {
              include: {
                team: {
                  select: {
                    name: true,
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
