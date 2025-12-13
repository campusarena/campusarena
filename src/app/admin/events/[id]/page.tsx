import { prisma } from '@/lib/prisma';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminKickUserFromTournamentAction } from '@/lib/adminActions';
import ConfirmActionForm from '@/components/ConfirmActionForm';
import { adminDeleteTournamentAction } from '@/lib/adminActions';

export default async function AdminEventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const tournamentId = Number.parseInt(id, 10);
  if (!Number.isFinite(tournamentId)) {
    notFound();
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      name: true,
      game: true,
      status: true,
      visibility: true,
      staff: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, email: true, name: true, role: true } },
        },
        orderBy: [{ role: 'asc' }],
      },
      participants: {
        select: {
          id: true,
          user: { select: { id: true, email: true, name: true, role: true } },
          team: {
            select: {
              id: true,
              name: true,
              members: {
                select: {
                  user: { select: { id: true, email: true, name: true, role: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const teamUsers = tournament.participants.flatMap((p) => {
    const team = p.team;
    return team ? team.members.map((m) => ({ teamName: team.name, user: m.user })) : [];
  });

  const directUsers = tournament.participants.flatMap((p) => (p.user ? [{ user: p.user }] : []));

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="m-0">Admin · Event</h1>
          <div className="text-muted">
            {tournament.name} · {tournament.game} · {tournament.status} · {tournament.visibility}
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <ConfirmActionForm
            action={adminDeleteTournamentAction}
            confirmMessage={`Delete event "${tournament.name}"? This cannot be undone.`}
          >
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <Button variant="danger" size="sm" type="submit">
              Delete Event
            </Button>
          </ConfirmActionForm>

          <Link href="/admin/events" className="btn btn-outline-light btn-sm">
            Back
          </Link>
        </div>
      </div>

      <Card className="ca-feature-card p-3 mb-3">
        <h2 className="h5">Staff</h2>
        {tournament.staff.length === 0 ? (
          <div className="text-muted">No staff roles assigned.</div>
        ) : (
          <Table responsive hover variant="dark" className="m-0">
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ border: 'none', padding: '0.75rem' }}>User</th>
                <th style={{ border: 'none', padding: '0.75rem' }}>Role</th>
                <th style={{ border: 'none', padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournament.staff.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <td style={{ border: 'none', padding: '0.75rem' }}>
                    {s.user.name} ({s.user.email})
                  </td>
                  <td style={{ border: 'none', padding: '0.75rem' }}>{s.role}</td>
                  <td style={{ border: 'none', padding: '0.75rem' }}>
                    <ConfirmActionForm
                      action={adminKickUserFromTournamentAction}
                      confirmMessage={`Kick ${s.user.email} from this event?`}
                    >
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <input type="hidden" name="userId" value={s.user.id} />
                      <Button variant="warning" size="sm" type="submit">
                        Kick
                      </Button>
                    </ConfirmActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="ca-feature-card p-3">
        <h2 className="h5">Participants</h2>

        {(directUsers.length === 0 && teamUsers.length === 0) ? (
          <div className="text-muted">No participants found.</div>
        ) : (
          <Table responsive hover variant="dark" className="m-0">
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ border: 'none', padding: '0.75rem' }}>User</th>
                <th style={{ border: 'none', padding: '0.75rem' }}>Team</th>
                <th style={{ border: 'none', padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {directUsers.map(({ user }) => (
                <tr key={`u-${user.id}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <td style={{ border: 'none', padding: '0.75rem' }}>
                    {user.name} ({user.email})
                  </td>
                  <td style={{ border: 'none', padding: '0.75rem' }}>—</td>
                  <td style={{ border: 'none', padding: '0.75rem' }}>
                    <ConfirmActionForm
                      action={adminKickUserFromTournamentAction}
                      confirmMessage={`Kick ${user.email} from this event?`}
                    >
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <input type="hidden" name="userId" value={user.id} />
                      <Button variant="warning" size="sm" type="submit">
                        Kick
                      </Button>
                    </ConfirmActionForm>
                  </td>
                </tr>
              ))}

              {teamUsers.map(({ teamName, user }) => (
                <tr key={`tm-${teamName}-${user.id}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <td style={{ border: 'none', padding: '0.75rem' }}>
                    {user.name} ({user.email})
                  </td>
                  <td style={{ border: 'none', padding: '0.75rem' }}>{teamName ?? '—'}</td>
                  <td style={{ border: 'none', padding: '0.75rem' }}>
                    <ConfirmActionForm
                      action={adminKickUserFromTournamentAction}
                      confirmMessage={`Kick ${user.email} from this event?`}
                    >
                      <input type="hidden" name="tournamentId" value={tournament.id} />
                      <input type="hidden" name="userId" value={user.id} />
                      <Button variant="warning" size="sm" type="submit">
                        Kick
                      </Button>
                    </ConfirmActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
