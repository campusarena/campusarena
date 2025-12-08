// src/app/matches/[id]/page.tsx
import { EventRole, MatchStatus, PrismaClient } from '@prisma/client';
import MatchClient from './MatchClient';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';

const prisma = new PrismaClient();

// Minimal shape we care about: user.name/email and team.name
type ParticipantLike =
  | {
      user: { name: string | null; email: string | null } | null;
      team: { name: string } | null;
    }
  | null;

function displayParticipant(p: ParticipantLike): string {
  if (!p) return 'TBD';
  if (p.team) return p.team.name;
  if (p.user) {
    // 👇 Prefer player name, then fall back to email
    return p.user.name ?? p.user.email ?? 'Unknown player';
  }
  return 'TBD';
}

type PageProps = {
  params: { id: string };
};

export default async function MatchPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const typedUser = session?.user as { id?: string | number } | undefined;
  const currentUserId = typedUser?.id ? Number(typedUser.id) : null;

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
      tournament: {
        include: {
          staff: true,
        },
      },
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
      reports: true,
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

  const team1Name = displayParticipant(match.p1 as ParticipantLike);
  const team2Name = displayParticipant(match.p2 as ParticipantLike);

  const hasOrganizerAccess = !!(
    currentUserId &&
    match.tournament.staff.some(
      (s) =>
        s.userId === currentUserId &&
        (s.role === EventRole.OWNER || s.role === EventRole.ORGANIZER),
    )
  );

  const latestPendingReport = match.reports
    .filter((r) => r.status === 'PENDING')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;

  return (
    <MatchClient
      matchId={match.id}
      tournamentId={match.tournamentId}
      tournamentName={match.tournament.name}
      team1Name={team1Name}
      team2Name={team2Name}
      gameName={match.tournament.game}
      scheduledAt={match.scheduledAt ? match.scheduledAt.toISOString() : null}
      hasOrganizerAccess={hasOrganizerAccess}
      reportId={latestPendingReport?.id ?? null}
      matchStatus={match.status as MatchStatus}
      initialP1Score={latestPendingReport?.p1Score ?? match.p1Score ?? null}
      initialP2Score={latestPendingReport?.p2Score ?? match.p2Score ?? null}
    />
  );
}
