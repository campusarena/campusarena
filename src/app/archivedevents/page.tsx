// src/app/archivedevents/page.tsx
import Container from 'react-bootstrap/Container';
import { prisma } from '@/lib/prisma';
import PublicEventsClient, {
  type PublicEventCardData,
} from '@/app/publicevents/PublicEventsClient';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { redirect } from 'next/navigation';

export default async function ArchivedEventsPage() {
  // Require login
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!currentUser) {
    redirect('/auth/signin');
  }

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: 'completed',
      participants: {
        some: {
          OR: [
            { userId: currentUser.id },
            {
              team: {
                members: {
                  some: {
                    userId: currentUser.id,
                  },
                },
              },
            },
          ],
        },
      },
    },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: [
      { endDate: 'desc' },   // most recently completed first
      { startDate: 'desc' }, // tie-breaker
    ],
  });

  const events: PublicEventCardData[] = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    game: t.game,
    date: t.endDate
      ? t.endDate.toISOString()
      : t.startDate
        ? t.startDate.toISOString()
        : null,
    status: t.status,
    format: t.format,
    isTeamBased: t.isTeamBased,
    maxParticipants: t.maxParticipants,
    participantCount: t._count.participants,
    location: t.location,
  }));

  return (
    <section className="ca-section">
      <Container>
        <h1 className="fw-bold text-white mb-2">Archived Events</h1>
        <p className="ca-section-subtitle mb-4">
          View completed events and their final states.
        </p>

        <PublicEventsClient events={events} showSortControls={false} />
      </Container>
    </section>
  );
}
