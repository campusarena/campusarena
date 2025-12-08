/**
 * Type definitions for Match Status System
 */

export type MatchStatus = 
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'SCHEDULED'
  | 'REPORTED'
  | 'VERIFIED'
  | 'COMPLETE'
  | 'CANCELED';

export interface MatchCheckInRequest {
  matchId: number;
  participantId: number;
}

export interface MatchStartRequest {
  matchId: number;
}

export interface MatchCompleteRequest {
  matchId: number;
  winnerId: number;
  p1Score?: number;
  p2Score?: number;
}

export interface MatchStatusResponse {
  success: boolean;
  message: string;
  match: {
    id: number;
    status: string;
    p1Id?: number | null;
    p2Id?: number | null;
    winnerId?: number | null;
  };
  bothCheckedIn?: boolean;
}

export interface MatchStatusSummary {
  matchId: number;
  status: MatchStatus;
  checkIn1: boolean;
  checkIn2: boolean;
  bothCheckedIn: boolean;
  canStart: boolean;
  canComplete: boolean;
  isFinished: boolean;
  winner?: {
    id: number;
    userId?: number | null;
    teamId?: number | null;
  };
  p1Score?: number | null;
  p2Score?: number | null;
}

export interface MatchTransitionValidation {
  isValid: boolean;
  error?: string;
  currentStatus?: string;
}
