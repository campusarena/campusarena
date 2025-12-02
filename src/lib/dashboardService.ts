// src/lib/dashboardService.ts

// Temporary dashboard data shape.
// In Issue #35 we'll move these types into a central types file.
export type DashboardEvent = {
  id: string;
  name: string;
  kind: string; // "League" | "Tournament" | etc.
};

export type DashboardMatch = {
  id: string;
  name: string;
  date: string;
  description?: string;
};

export type DashboardResult = {
  id: string;
  name: string;
  description: string;
};

export type DashboardData = {
  activeEvents: DashboardEvent[];
  upcomingMatches: DashboardMatch[];
  nextMatches: DashboardMatch[];
  recentResults: DashboardResult[];
};

// Mock "service" – later can be replaced with Prisma.
export async function getDashboardDataForUser(
  userId: string | null
): Promise<DashboardData> {
  // For now we ignore userId and return static mock data.
  return {
    activeEvents: [
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
    ],
    upcomingMatches: [
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
    ],
    nextMatches: [
      {
        id: 'my-next-monday-soccer',
        name: 'Monday Night Soccer',
        date: 'April 29',
      },
    ],
    recentResults: [
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
    ],
  };
}
