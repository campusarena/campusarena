// src/types/dashboard.ts

// What kinds of events we support in the UI.
export type EventKind = 'League' | 'Tournament' | 'Ladder' | 'Other';

export type DashboardEvent = {
  id: string;
  name: string;
  kind: EventKind;
};

export type DashboardMatch = {
  id: string;
  name: string;
  date: string;          // e.g. "April 29"
  description?: string;  // e.g. "Tigers vs Wildcats"
};

export type DashboardResult = {
  id: string;
  name: string;          // e.g. "Spring League Finals"
  description: string;   // e.g. "Alpha Squad vs Night Owls"
};

export type DashboardData = {
  activeEvents: DashboardEvent[];
  upcomingMatches: DashboardMatch[];
  nextMatches: DashboardMatch[];
  recentResults: DashboardResult[];
};
