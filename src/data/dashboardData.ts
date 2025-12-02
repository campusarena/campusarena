// src/data/dashboardData.ts

export type ActiveEvent = {
  id: number;
  name: string;
  type: string;
};

export type MatchItem = {
  id: number;
  title: string;
  date: string;
  extra: string;
};

export type SimpleItem = {
  id: number;
  title: string;
  extra: string;
};

export const activeEvents: ActiveEvent[] = [
  { id: 1, name: 'Spring Basketball League', type: 'League' },
  { id: 2, name: 'Open Smash Tournament', type: 'Tournament' },
];

export const upcomingMatches: MatchItem[] = [
  {
    id: 1,
    title: 'Monday Night Soccer',
    date: 'April 29',
    extra: 'Tigers vs Wildcats',
  },
  {
    id: 2,
    title: 'Collegiate Dota 2 Championship',
    date: 'May 1',
    extra: 'Alpha Team vs Group B',
  },
];

export const myNextMatches: SimpleItem[] = [
  {
    id: 1,
    title: 'Monday Night Soccer',
    extra: 'April 29',
  },
];

export const recentResults: SimpleItem[] = [
  {
    id: 1,
    title: 'Basketball Team A vs Basketball Team D',
    extra: 'Player 1 vs Player 3',
  },
  {
    id: 2,
    title: 'Spring League Finals',
    extra: 'Alpha Squad vs Night Owls',
  },
];
