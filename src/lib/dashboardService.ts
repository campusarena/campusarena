// src/lib/dashboardService.ts

import { prisma } from '@/lib/prisma';
import type {
  DashboardData,
  DashboardEvent,
  DashboardMatch,
  DashboardResult,
  EventKind,
} from '@/types/dashboard';
import {
  MatchStatus,
  type Match,
  type Participant,
  type Tournament,
  type User,
  type Team,
} from '@prisma/client';

// Include types with relations for cleaner helpers
type ParticipantWithUserTeam = Participant & {
  user: User | null;
  team: Team | null;
};

type MatchWithRelations = Match & {
  tournament: Tournament;
  p1: ParticipantWithUserTeam | null;
  p2: ParticipantWithUserTeam | null;
  winner: ParticipantWithUserTeam | null;
};

/**
 * Load all dashboard data for a given user.
 */
export async function getDashboardDataForUser(userId: number): Promise<DashboardData> {
  // 1️⃣ Tournaments this user is playing in
  const participantRows = await prisma.participant.findMany({
    where: { userId },
    include: {
      tournament: true,
    },
  });

  // 2️⃣ Tournaments this user organizes (OWNER or ORGANIZER)
  const organizerRoles = await prisma.eventRoleAssignment.findMany({
    where: { userId },
    include: {
      tournament: true,
    },
  });

  // Helper to map Tournament → EventKind (for now, all "Tournament")
  const inferEventKind = (): EventKind => 'Tournament';

  // Events as player
  const eventsAsPlayer: DashboardEvent[] = participantRows.map((p) => ({
    id: String(p.tournament.id),
    name: p.tournament.name,
    kind: inferEventKind(),
  }));

  // Events as organizer
  const eventsAsOrganizer: DashboardEvent[] = organizerRoles.map((r) => ({
    id: String(r.tournament.id),
    name: r.tournament.name,
    kind: inferEventKind(),
  }));

  // Deduplicate events (user might be both player and organizer)
  const eventMap = new Map<string, DashboardEvent>();
  [...eventsAsPlayer, ...eventsAsOrganizer].forEach((ev) => {
    eventMap.set(ev.id, ev);
  });
  const activeEvents = Array.from(eventMap.values());

  // 3️⃣ Upcoming matches (for this user as participant)
  const participantIds = participantRows.map((p) => p.id);

  let upcomingMatches: DashboardMatch[] = [];
  let nextMatches: DashboardMatch[] = [];
  let recentResults: DashboardResult[] = [];

  if (participantIds.length > 0) {
    const upcomingMatchRowsRaw = await prisma.match.findMany({
      where: {
        OR: [
          { p1Id: { in: participantIds } },
          { p2Id: { in: participantIds } },
        ],
        status: {
          in: [MatchStatus.PENDING, MatchStatus.SCHEDULED],
        },
      },
      include: {
        tournament: true,
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // 🔹 Extra safety filter: only matches where THIS user is p1 or p2
    const upcomingMatchRows = upcomingMatchRowsRaw.filter(
      (m) =>
        (m.p1 && m.p1.userId === userId) ||
        (m.p2 && m.p2.userId === userId),
    );

    upcomingMatches = upcomingMatchRows.map((m) => ({
      id: String(m.id),
      name: m.tournament.name,
      date: m.scheduledAt ? m.scheduledAt.toLocaleDateString() : 'TBD',
      description: buildMatchDescription(m),
    }));

    // Next matches: just the first 1–2 for the "Your next match" card
    nextMatches = upcomingMatches.slice(0, 2);

    // 4️⃣ Recent verified results
    const recentMatchRowsRaw = await prisma.match.findMany({
      where: {
        OR: [
          { p1Id: { in: participantIds } },
          { p2Id: { in: participantIds } },
        ],
        status: MatchStatus.VERIFIED,
      },
      include: {
        tournament: true,
        p1: { include: { user: true, team: true } },
        p2: { include: { user: true, team: true } },
        winner: { include: { user: true, team: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 10, // grab a few, then we’ll collapse by tournament
    });

    // 🔹 Collapse to one result per tournament (typically the latest match, e.g. final)
    const seenTournament = new Set<number>();
    const recentMatchRows: MatchWithRelations[] = [];
    for (const m of recentMatchRowsRaw as MatchWithRelations[]) {
      if (seenTournament.has(m.tournamentId)) continue;
      seenTournament.add(m.tournamentId);
      recentMatchRows.push(m);
    }

    recentResults = recentMatchRows.slice(0, 5).map((m) => ({
      id: String(m.id),
      name: m.tournament.name,
      description: buildResultDescription(m),
    }));
  }

  const data: DashboardData = {
    activeEvents,
    upcomingMatches,
    nextMatches,
    recentResults,
  };

  return data;
}

// ----------------------
// Helper formatting
// ----------------------

// We only need p1/p2 for upcoming matches.
type MatchForUpcoming = {
  p1: ParticipantWithUserTeam | null;
  p2: ParticipantWithUserTeam | null;
};

function displayParticipant(p: ParticipantWithUserTeam | null): string {
  if (!p) return 'TBD';
  if (p.team) return p.team.name;
  if (p.user) return p.user.email ?? 'Unknown player';
  return 'TBD';
}

function buildMatchDescription(match: MatchForUpcoming): string {
  const p1 = displayParticipant(match.p1);
  const p2 = displayParticipant(match.p2);
  return `${p1} vs ${p2}`;
}

// For results we do need winner & tournament info.
function buildResultDescription(match: MatchWithRelations): string {
  const p1 = displayParticipant(match.p1);
  const p2 = displayParticipant(match.p2);
  const winner = displayParticipant(match.winner);
  return `${p1} vs ${p2} — Winner: ${winner}`;
}
