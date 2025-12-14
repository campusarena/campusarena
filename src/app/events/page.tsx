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
        status: { in: ['upcoming', 'ongoing'] },
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
        },
        orderBy: { seed: 'asc' },
      },
      matches: {
        include: {
          p1: { include: { user: true, team: true } },
          p2: { include: { user: true, team: true } },
        },
        where: {
          status: MatchStatus.VERIFIED,
        },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  // Convert DB → UI
  const uiEvents: EventListing[] = tournaments.map((t) => {
    // Build a win/loss map per player (user or team) based only on
    // COMPLETED matches in this specific tournament.
    const recordByPlayer = new Map<number, { wins: number; losses: number }>();

    const playerKeyForParticipant = (p: (typeof t.participants)[number]) =>
      p.userId ?? p.teamId ?? p.id;

    for (const m of t.matches) {
      if (!m.p1 || !m.p2 || !m.winnerId) continue;

      const p1Key = playerKeyForParticipant(m.p1);
      const p2Key = playerKeyForParticipant(m.p2);

      const winnerKey = m.winnerId === m.p1.id ? p1Key : p2Key;
      const loserKey = winnerKey === p1Key ? p2Key : p1Key;

      const winnerRec = recordByPlayer.get(winnerKey) ?? { wins: 0, losses: 0 };
      winnerRec.wins += 1;
      recordByPlayer.set(winnerKey, winnerRec);

      const loserRec = recordByPlayer.get(loserKey) ?? { wins: 0, losses: 0 };
      loserRec.losses += 1;
      recordByPlayer.set(loserKey, loserRec);
    }

    const standings = t.participants.map((p) => {
      const key = playerKeyForParticipant(p);
      const rec = recordByPlayer.get(key) ?? { wins: 0, losses: 0 };

      const name =
        p.team?.name ??
        p.user?.name ??
        p.user?.email ??
        `Seed ${p.seed ?? '?'}`;

      return { team: name, wins: rec.wins, losses: rec.losses };
    });

    // Sort by wins desc, then losses asc, then name.
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.team.localeCompare(b.team);
    });

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
