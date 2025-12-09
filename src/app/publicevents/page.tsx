// src/app/events/page.tsx
import Container from 'react-bootstrap/Container';
import { prisma } from '@/lib/prisma';
import PublicEventsClient, {
  type PublicEventCardData,
} from '@/app/publicevents/PublicEventsClient';
import BackButton from "@/components/BackButton";

export default async function EventsPage() {
  // Grab all public tournaments
  const tournaments = await prisma.tournament.findMany({
    where: {
      visibility: 'PUBLIC',                         // only public events
      status: { in: ['upcoming', 'ongoing'] },      // tweak as you like
    },
    include: {
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { startDate: 'asc' }, // initial sort (client can re-sort)
  });

  const events: PublicEventCardData[] = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    game: t.game,
    date: t.startDate ? t.startDate.toISOString() : null,
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
        <div className="mb-3">
        <BackButton />
        </div>
        <h1 className="fw-bold text-white mb-2">Browse Events</h1>
        <p className="ca-section-subtitle mb-4">
          View public tournaments, leagues, and upcoming competitions.
        </p>

        <PublicEventsClient events={events} />
      </Container>
    </section>
  );
}
