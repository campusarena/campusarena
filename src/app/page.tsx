import { prisma } from "@/lib/prisma";
import HomeClient, { LandingEvent } from "./HomeClient";

export default async function Home() {
  // Fetch real public upcoming events
  const tournaments = await prisma.tournament.findMany({
    where: {
      visibility: "PUBLIC",
      status: { in: ["upcoming", "ongoing"] },
    },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: { startDate: "asc" },
    take: 3, // Only show the first 3 events
  });

  const upcomingEvents: LandingEvent[] = tournaments.map((t) => ({
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

  return <HomeClient upcomingEvents={upcomingEvents} />;
}