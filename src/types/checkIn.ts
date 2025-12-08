/**
 * Type definitions for Match Check-In Flow
 */

export type PlayerPosition = 'player1' | 'player2' | 'spectator';

export interface MatchCheckInData {
  matchId: number;
  status: string;
  player1Id: number | null;
  player2Id: number | null;
  checkIn1: boolean;
  checkIn2: boolean;
  player1Name: string;
  player2Name: string;
}

export interface CheckInResult {
  success: boolean;
  message?: string;
  error?: string;
  status?: string;
}

export interface MatchParticipant {
  id: number;
  userId?: number | null;
  teamId?: number | null;
  user?: {
    id: number;
    email: string;
  } | null;
  team?: {
    id: number;
    name: string;
    members: Array<{
      userId: number;
    }>;
  } | null;
}
