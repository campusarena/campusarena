import { prisma } from "@/lib/prisma";
import StandingsClient, {
  TournamentStanding,
} from "./StandingsClient";

// helper to format dates into something like "Nov 25, 2025 6:30 PM"
function formatDate(d: Date | null | undefined): string {
  if (!d) return "TBD";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function StandingsPage() {
  // 1. Pull tournaments + participants + their matches from Prisma
  const tournaments = await prisma.tournament.findMany({
    include: {
      participants: {
        include: {
          matchesAsP1: true,
          matchesAsP2: true,
          matchesWon: true,
        },
      },
    },
  });

  // 2. Adapt raw DB data into the simple shape our client UI wants
  const uiTournaments: TournamentStanding[] = tournaments.map((t) => {
    const standings = t.participants.map((p) => {
      const gamesPlayed = p.matchesAsP1.length + p.matchesAsP2.length;
      const wins = p.matchesWon.length;
      const losses = gamesPlayed - wins;

      // simple placeholder scoring rule: 3 points per win
      const points = wins * 3;

      return {
        team: p.userId
          ? `Player ${p.userId}`
          : `Seed ${p.seed ?? "?"}`,
        wins,
        losses,
        points,
      };
    });

    // sort so the table is in “standings” order
    standings.sort((a, b) => b.points - a.points);

    return {
      id: t.id,
      name: t.name,
      game: t.game,
      nextMatch: formatDate(t.startDate),
      standings,
    };
  });

  // 3. Render the client component with this data
  return <StandingsClient tournaments={uiTournaments} />;
}