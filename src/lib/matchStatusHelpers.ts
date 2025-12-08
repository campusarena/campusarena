import { prisma } from '@/lib/prisma';
import { MatchStatus } from '@prisma/client';

/**
 * Match Status System Helper Functions
 * 
 * These functions encapsulate the business logic for managing match states,
 * check-ins, and transitions between statuses.
 */

export interface CheckInResult {
  success: boolean;
  message: string;
  match: {
    id: number;
    status: string;
    checkIn1?: boolean;
    checkIn2?: boolean;
  };
  bothCheckedIn?: boolean;
}

export interface MatchStatusValidation {
  isValid: boolean;
  error?: string;
  currentStatus?: string;
}

/**
 * Updates check-in status for a participant and automatically
 * transitions match to READY if both participants have checked in
 */
export async function updateCheckIn(
  matchId: number,
  participantId: number
): Promise<CheckInResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
    },
  });

  if (!match) {
    throw new Error('Match not found');
  }

  // Validate match state
  if (match.status === MatchStatus.IN_PROGRESS || match.status === MatchStatus.COMPLETE) {
    return {
      success: false,
      message: `Cannot check in. Match is already ${match.status}`,
      match,
    };
  }

  // Determine which player is checking in
  const updateData: { checkIn1?: boolean; checkIn2?: boolean } = {};
  let isP1 = false;

  if (match.p1Id === participantId) {
    if (match.checkIn1) {
      return {
        success: false,
        message: 'Player 1 already checked in',
        match,
      };
    }
    updateData.checkIn1 = true;
    isP1 = true;
  } else if (match.p2Id === participantId) {
    if (match.checkIn2) {
      return {
        success: false,
        message: 'Player 2 already checked in',
        match,
      };
    }
    updateData.checkIn2 = true;
  } else {
    return {
      success: false,
      message: 'Participant is not part of this match',
      match,
    };
  }

  // Update check-in
  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: updateData,
    include: {
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
    },
  });

  // Check if both players are now checked in
  const bothCheckedIn = isP1 
    ? updatedMatch.checkIn1 && match.checkIn2
    : match.checkIn1 && updatedMatch.checkIn2;

  // Auto-transition to READY if both checked in and status is PENDING
  if (bothCheckedIn && match.status === MatchStatus.PENDING) {
    const readyMatch = await prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.READY },
      include: {
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
      },
    });

    return {
      success: true,
      message: 'Both players checked in. Match is now READY!',
      match: readyMatch,
      bothCheckedIn: true,
    };
  }

  return {
    success: true,
    message: 'Check-in successful. Waiting for other player.',
    match: updatedMatch,
    bothCheckedIn: false,
  };
}

/**
 * Starts a match - transitions from READY to IN_PROGRESS
 */
export async function startMatch(matchId: number) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new Error('Match not found');
  }

  if (match.status !== MatchStatus.READY) {
    throw new Error(
      `Cannot start match. Current status is ${match.status}. Match must be READY to start.`
    );
  }

  return await prisma.match.update({
    where: { id: matchId },
    data: { status: MatchStatus.IN_PROGRESS },
    include: {
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
    },
  });
}

/**
 * Completes a match - transitions from IN_PROGRESS to COMPLETE
 * Records winner and optionally scores
 */
export async function completeMatch(
  matchId: number,
  winnerId: number,
  p1Score?: number,
  p2Score?: number
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      p1: true,
      p2: true,
    },
  });

  if (!match) {
    throw new Error('Match not found');
  }

  if (match.status !== MatchStatus.IN_PROGRESS) {
    throw new Error(
      `Cannot complete match. Current status is ${match.status}. Match must be IN_PROGRESS to complete.`
    );
  }

  if (winnerId !== match.p1Id && winnerId !== match.p2Id) {
    throw new Error('Winner must be one of the match participants');
  }

  const updateData: {
    status: MatchStatus;
    winnerId: number;
    completedAt: Date;
    p1Score?: number;
    p2Score?: number;
  } = {
    status: MatchStatus.COMPLETE,
    winnerId: winnerId,
    completedAt: new Date(),
  };

  if (p1Score !== undefined) updateData.p1Score = p1Score;
  if (p2Score !== undefined) updateData.p2Score = p2Score;

  const completedMatch = await prisma.match.update({
    where: { id: matchId },
    data: updateData,
    include: {
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
      winner: { include: { user: true, team: true } },
    },
  });

  // Advance winner if there's a next match
  if (completedMatch.nextMatchId) {
    await advanceWinnerToNextMatch(completedMatch.id);
  }

  return completedMatch;
}

/**
 * Validates if a match can transition to a given status
 */
export function validateMatchTransition(
  currentStatus: string,
  targetStatus: string
): MatchStatusValidation {
  const validTransitions: Record<string, string[]> = {
    PENDING: ['READY', 'CANCELED'],
    READY: ['IN_PROGRESS', 'CANCELED'],
    IN_PROGRESS: ['COMPLETE', 'CANCELED'],
    COMPLETE: [], // Final state
    CANCELED: [], // Final state
  };

  const allowedNext = validTransitions[currentStatus] || [];
  
  if (!allowedNext.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Cannot transition from ${currentStatus} to ${targetStatus}`,
      currentStatus,
    };
  }

  return { isValid: true };
}

/**
 * Checks if both participants have checked in
 */
export async function areBothPlayersCheckedIn(matchId: number): Promise<boolean> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { checkIn1: true, checkIn2: true },
  });

  return match ? match.checkIn1 && match.checkIn2 : false;
}

/**
 * Helper to advance winner to next bracket match
 */
async function advanceWinnerToNextMatch(matchId: number) {
  const completedMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: { nextMatchId: true, winnerId: true },
  });

  if (!completedMatch?.nextMatchId || !completedMatch.winnerId) {
    return;
  }

  const nextMatch = await prisma.match.findUnique({
    where: { id: completedMatch.nextMatchId },
  });

  if (!nextMatch) return;

  // Fill empty slot in next match
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
}

/**
 * Gets match status summary
 */
export async function getMatchStatusSummary(matchId: number) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      checkIn1: true,
      checkIn2: true,
      p1Score: true,
      p2Score: true,
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
      winner: { include: { user: true, team: true } },
    },
  });

  if (!match) return null;

  return {
    matchId: match.id,
    status: match.status,
    checkIn1: match.checkIn1,
    checkIn2: match.checkIn2,
    bothCheckedIn: match.checkIn1 && match.checkIn2,
    canStart: match.status === MatchStatus.READY,
    canComplete: match.status === MatchStatus.IN_PROGRESS,
    isFinished: match.status === MatchStatus.COMPLETE,
    winner: match.winner,
    p1Score: match.p1Score,
    p2Score: match.p2Score,
  };
}
