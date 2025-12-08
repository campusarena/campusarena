'use server';

import { prisma } from '@/lib/prisma';
import { MatchStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Server action to handle player check-in
 * Updates the appropriate checkIn field and auto-transitions to READY when both players check in
 */
export async function handleCheckIn(matchId: number, participantId: number) {
  try {
    // Get the match with participant info
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
      },
    });

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    // Validate: Cannot check in if match is already IN_PROGRESS or COMPLETE
    if (match.status === MatchStatus.IN_PROGRESS || match.status === MatchStatus.COMPLETE) {
      return { 
        success: false, 
        error: `Cannot check in. Match is already ${match.status}` 
      };
    }

    // Determine which player is checking in
    const updateData: { checkIn1?: boolean; checkIn2?: boolean } = {};
    
    if (match.p1Id === participantId) {
      if (match.checkIn1) {
        return { success: false, error: 'Player 1 already checked in' };
      }
      updateData.checkIn1 = true;
    } else if (match.p2Id === participantId) {
      if (match.checkIn2) {
        return { success: false, error: 'Player 2 already checked in' };
      }
      updateData.checkIn2 = true;
    } else {
      return { success: false, error: 'You are not a participant in this match' };
    }

    // Update the check-in status
    await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    // Check if both players are now checked in
    const bothCheckedIn =
      (match.p1Id === participantId ? true : match.checkIn1) &&
      (match.p2Id === participantId ? true : match.checkIn2);

    // If both checked in and status is PENDING, update to READY
    if (bothCheckedIn && match.status === MatchStatus.PENDING) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: MatchStatus.READY },
      });

      // Revalidate the match page
      revalidatePath(`/match/${matchId}`);
      
      return {
        success: true,
        message: 'Both players checked in. Match is now READY!',
        status: 'READY',
      };
    }

    // Revalidate the match page
    revalidatePath(`/match/${matchId}`);

    return {
      success: true,
      message: 'Check-in successful. Waiting for opponent...',
      status: match.status,
    };
  } catch (error) {
    console.error('Check-in error:', error);
    return {
      success: false,
      error: 'Failed to process check-in',
    };
  }
}

/**
 * Server action to start a match
 */
export async function handleStartMatch(matchId: number) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    if (match.status !== MatchStatus.READY) {
      return { 
        success: false, 
        error: `Cannot start match. Current status is ${match.status}` 
      };
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.IN_PROGRESS },
    });

    revalidatePath(`/match/${matchId}`);

    return {
      success: true,
      message: 'Match started successfully',
    };
  } catch (error) {
    console.error('Start match error:', error);
    return {
      success: false,
      error: 'Failed to start match',
    };
  }
}
