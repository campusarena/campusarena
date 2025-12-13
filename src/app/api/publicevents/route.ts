import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
  const tournaments = await prisma.tournament.findMany({
    where: {
      visibility: "PUBLIC",
      status: "upcoming",
    },
    include: {
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const events = tournaments.map((t) => ({
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

  return NextResponse.json(events);
};