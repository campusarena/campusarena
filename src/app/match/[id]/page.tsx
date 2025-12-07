// src/app/matches/[id]/page.tsx
import { PrismaClient } from '@prisma/client';
import MatchClient from './MatchClient';

const prisma = new PrismaClient();

// Minimal shape we care about: user.email and team.name
type ParticipantLike =
  | {
      user: { email: string | null } | null;
      team: { name: string } | null;
    }
  | null;

function displayParticipant(p: ParticipantLike): string {
  if (!p) return 'TBD';
  if (p.team) return p.team.name;
  if (p.user) return p.user.email ?? 'Unknown player';
  return 'TBD';
}

type PageProps = {
  params: { id: string };
};

export default async function MatchPage({ params }: PageProps) {
  const matchId = Number(params.id);
  if (Number.isNaN(matchId)) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>Invalid match ID</h1>
        </div>
      </section>
    );
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
    },
  });

  if (!match) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>Match not found</h1>
        </div>
      </section>
    );
  }

  const team1Name = displayParticipant(match.p1);
  const team2Name = displayParticipant(match.p2);

  return (
    <MatchClient
      matchId={match.id}
      tournamentId={match.tournamentId}
      tournamentName={match.tournament.name}
      team1Name={team1Name}
      team2Name={team2Name}
      gameName={match.tournament.game}
      scheduledAt={match.scheduledAt ? match.scheduledAt.toISOString() : null}
    />
  );
}
