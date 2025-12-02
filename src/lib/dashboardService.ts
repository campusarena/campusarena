// src/lib/dashboardService.ts

import type {
  DashboardData,
  DashboardEvent,
  DashboardMatch,
  DashboardResult,
} from '@/types/dashboard';

// Mock "service" – later can be replaced with Prisma.
export async function getDashboardDataForUser(
  userId: string | null
): Promise<DashboardData> {
  // For now we ignore userId and return static mock data.

  const activeEvents: DashboardEvent[] = [
    {
      id: 'spring-basketball-league',
      name: 'Spring Basketball League',
      kind: 'League',
    },
    {
      id: 'open-smash-tournament',
      name: 'Open Smash Tournament',
      kind: 'Tournament',
    },
  ];

  const upcomingMatches: DashboardMatch[] = [
    {
      id: 'monday-night-soccer',
      name: 'Monday Night Soccer',
      date: 'April 29',
      description: 'Tigers vs Wildcats',
    },
    {
      id: 'dota2-championship',
      name: 'Collegiate Dota 2 Championship',
      date: 'May 1',
      description: 'Alpha Team vs Group B',
    },
  ];

  const nextMatches: DashboardMatch[] = [
    {
      id: 'my-next-monday-soccer',
      name: 'Monday Night Soccer',
      date: 'April 29',
    },
  ];

  const recentResults: DashboardResult[] = [
    {
      id: 'team-a-vs-d',
      name: 'Basketball Team A vs Basketball Team D',
      description: 'Player 1 vs Player 3',
    },
    {
      id: 'spring-league-finals',
      name: 'Spring League Finals',
      description: 'Alpha Squad vs Night Owls',
    },
  ];

  const data: DashboardData = {
    activeEvents,
    upcomingMatches,
    nextMatches,
    recentResults,
  };

  return data;
}
