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
    const { reportId, action } = await request.json(); // action: 'approve' or 'reject'

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user and check if admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get the report
    const report = await prisma.matchReport.findUnique({
      where: { id: reportId },
      include: {
        match: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Approve the report
      await prisma.matchReport.update({
        where: { id: reportId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });

      // Update match with final scores and status
      await prisma.match.update({
        where: { id: report.matchId },
        data: {
          p1Score: report.p1Score,
          p2Score: report.p2Score,
          winnerId: report.winnerParticipantId,
          status: 'VERIFIED',
          completedAt: new Date(),
        },
      });

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
