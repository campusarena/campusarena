import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import TeamJoinClient from '@/app/events/[id]/teams/join/team-join-client';

const INVITE_EXPIRY_DAYS = 7;
const INVITE_EXPIRY_MS = INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

function isInvitationExpired(createdAt: Date): boolean {
  return Date.now() > createdAt.getTime() + INVITE_EXPIRY_MS;
}

export default async function TeamJoinPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { token?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    const token = searchParams?.token ?? '';
    redirect(`/auth/signin?callbackUrl=/events/${params.id}/teams/join?token=${encodeURIComponent(token)}`);
  }

  const userWithId = session.user as { id?: string | number };
  const currentUserId = userWithId?.id ? Number(userWithId.id) : null;
  if (!currentUserId) {
    const token = searchParams?.token ?? '';
    redirect(`/auth/signin?callbackUrl=/events/${params.id}/teams/join?token=${encodeURIComponent(token)}`);
  }

  const tournamentId = Number(params.id);
  const token = String(searchParams?.token ?? '').trim();

  if (!tournamentId || Number.isNaN(tournamentId)) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>Invalid event</h1>
        </div>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>Missing join token</h1>
        </div>
      </section>
    );
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: { tournamentId: true, createdAt: true },
  });

  if (!invitation || invitation.tournamentId !== tournamentId) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>Invalid join token</h1>
        </div>
      </section>
    );
  }

  if (isInvitationExpired(invitation.createdAt)) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>This join token has expired.</h1>
        </div>
      </section>
    );
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      isTeamBased: true,
      maxParticipants: true,
      status: true,
      teams: {
        orderBy: { createdAt: 'asc' },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
    },
  });

  if (!tournament) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>Event not found</h1>
        </div>
      </section>
    );
  }

  if (!tournament.isTeamBased) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>This event is not team-based.</h1>
        </div>
      </section>
    );
  }

  if (tournament.status === 'completed') {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>This event is completed.</h1>
        </div>
      </section>
    );
  }

  const maxTeams = tournament.maxParticipants;
  const canCreateTeam = maxTeams == null ? true : tournament.teams.length < maxTeams;

  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId: currentUserId,
      team: { tournamentId },
    },
    select: { id: true },
  });

  if (existingMembership) {
    redirect(`/events/${tournamentId}`);
  }

  return (
    <section className="ca-section">
      <div className="container d-flex justify-content-center">
        <TeamJoinClient
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          token={token}
          teams={tournament.teams.map((t) => ({
            id: t.id,
            name: t.name,
            memberCount: t.members.length,
          }))}
          canCreateTeam={canCreateTeam}
          maxTeams={maxTeams}
        />
      </div>
    </section>
  );
}
