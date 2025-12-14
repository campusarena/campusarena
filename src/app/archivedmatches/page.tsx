// src/app/archivedmatches/page.tsx
import Container from 'react-bootstrap/Container';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { MatchStatus } from '@prisma/client';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

function displayName(p: {
  user?: { name: string; email: string } | null;
  team?: { name: string } | null;
} | null): string {
  return p?.team?.name ?? p?.user?.name ?? p?.user?.email ?? 'TBD';
}

export default async function ArchivedMatchesPage() {
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

  const userParticipants = await prisma.participant.findMany({
    where: {
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
    select: { id: true },
  });

  const participantIds = userParticipants.map((p) => p.id);

  const matches = await prisma.match.findMany({
    where: {
      status: { in: [MatchStatus.COMPLETE, MatchStatus.VERIFIED] },
      OR: [{ p1Id: { in: participantIds } }, { p2Id: { in: participantIds } }],
    },
    include: {
      tournament: { select: { id: true, name: true } },
      p1: { include: { user: true, team: true } },
      p2: { include: { user: true, team: true } },
      winner: { include: { user: true, team: true } },
    },
    orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return (
    <section className="ca-section">
      <Container>
        <h1 className="fw-bold text-white mb-2">Archived Matches</h1>
        <p className="ca-section-subtitle mb-4">
          Completed matches you have access to.
        </p>

        {matches.length === 0 ? (
          <p className="text-light mb-0">No archived matches found.</p>
        ) : (
          <div className="ca-standings-table">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Matchup</th>
                  <th>Status</th>
                  <th>Completed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const p1Name = displayName(m.p1);
                  const p2Name = displayName(m.p2);
                  const completedLabel = m.completedAt
                    ? new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(m.completedAt)
                    : '—';

                  return (
                    <tr key={m.id}>
                      <td>
                        <Link
                          href={`/events/${m.tournament.id}`}
                          className="text-decoration-none text-light"
                        >
                          {m.tournament.name}
                        </Link>
                      </td>
                      <td>
                        {p1Name} vs {p2Name}
                        {m.winner && (
                          <div className="small text-light">
                            Winner: {displayName(m.winner)}
                          </div>
                        )}
                      </td>
                      <td className="text-uppercase small">{m.status}</td>
                      <td className="small">{completedLabel}</td>
                      <td className="text-end">
                        <Link
                          href={`/match/${m.id}`}
                          className="btn btn-sm btn-outline-light ca-glass-button"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </section>
  );
}
