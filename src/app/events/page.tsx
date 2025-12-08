// src/app/events/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import EventsClient, { EventListing } from './EventsClient';
import { MatchStatus } from '@prisma/client';

// Format “Nov 25, 2025 6:30 PM”
function formatDate(d: Date | null | undefined): string {
  if (!d) return 'TBD';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function EventsPage() {
  // Require login
  const session = await getServerSession(authOptions);
  const typedUser = session?.user as { id?: string | number } | undefined;

  if (!typedUser?.id) {
    redirect('/auth/signin?callbackUrl=/events');
  }

  const userId = Number(typedUser.id);

  // Pull events user can access:
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { participants: { some: { userId } } },
        { staff: { some: { userId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: true,
          team: true,
          matchesAsP1: true,
          matchesAsP2: true,
          matchesWon: true,
        },
      },
      matches: {
        where: {
          status: {
            in: [
              MatchStatus.PENDING,
              MatchStatus.SCHEDULED,
              MatchStatus.READY,
              MatchStatus.IN_PROGRESS,
            ],
          },
        },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  // Convert DB → UI
  const uiEvents: EventListing[] = tournaments.map((t) => {
    const standings = t.participants.map((p) => {
      const gamesPlayed = p.matchesAsP1.length + p.matchesAsP2.length;
      const wins = p.matchesWon.length;
      const losses = gamesPlayed - wins;

      const points = wins * 3;

      const name =
        p.team?.name ??
        p.user?.name ??
        p.user?.email ??
        `Seed ${p.seed ?? '?'}`;

      return { team: name, wins, losses, points };
    });

    standings.sort((a, b) => b.points - a.points);

    return {
      id: t.id,
      name: t.name,
      game: t.game,
      nextMatch: formatDate(t.startDate),
      standings,
    };
  });

  return <EventsClient events={uiEvents} />;
}
