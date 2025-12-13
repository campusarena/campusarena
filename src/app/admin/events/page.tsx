import { prisma } from '@/lib/prisma';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Link from 'next/link';
import { adminDeleteTournamentAction } from '@/lib/adminActions';
import ConfirmActionForm from '@/components/ConfirmActionForm';

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const qRaw = (searchParams?.q ?? '').trim();
  const q = qRaw.length > 0 ? qRaw : null;
  const qAsNumber = q ? Number(q) : NaN;
  const qIsNumber = q ? Number.isFinite(qAsNumber) : false;

  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      name: true,
      game: true,
      status: true,
      visibility: true,
      startDate: true,
      endDate: true,
      _count: { select: { participants: true, staff: true } },
    },
    where:
      q === null
        ? undefined
        : {
            OR: [
              ...(qIsNumber ? [{ id: qAsNumber }] : []),
              { name: { contains: q, mode: 'insensitive' } },
              { game: { contains: q, mode: 'insensitive' } },
            ],
          },
    orderBy: [{ createdAt: 'desc' }],
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">Admin · Events</h1>
        <div className="d-flex gap-2 flex-wrap">
          <Link href="/admin" className="btn btn-outline-light btn-sm">
            Admin Dashboard
          </Link>
          <Link href="/admin/users" className="btn btn-outline-light btn-sm">
            View Users
          </Link>
        </div>
      </div>

      <Card className="ca-feature-card p-3">
        <form method="get" className="d-flex gap-2 flex-wrap align-items-end mb-3">
          <div className="flex-grow-1" style={{ minWidth: 240 }}>
            <label className="text-white form-label">Search events</label>
            <input
              name="q"
              defaultValue={qRaw}
              placeholder="Search by name, game, or ID"
              className="form-control ca-auth-input"
            />
          </div>
          <button type="submit" className="btn btn-outline-light btn-sm ca-glass-button">
            Search
          </button>
          {q && (
            <Link href="/admin/events" className="btn btn-outline-light btn-sm">
              Clear
            </Link>
          )}
        </form>

        {tournaments.length === 0 ? (
          <div className="text-muted">No events found.</div>
        ) : (
        <Table responsive hover variant="dark" className="m-0">
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ border: 'none', padding: '0.75rem' }}>ID</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Name</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Game</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Status</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Visibility</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Participants</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Staff</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <td style={{ border: 'none', padding: '0.75rem' }}>{t.id}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{t.name}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{t.game}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{t.status}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{t.visibility}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{t._count.participants}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{t._count.staff}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link
                      href={`/admin/events/${t.id}`}
                      className="btn btn-outline-light btn-sm"
                    >
                      Manage
                    </Link>
                    <ConfirmActionForm
                      action={adminDeleteTournamentAction}
                      confirmMessage={`Delete event "${t.name}"? This cannot be undone.`}
                    >
                      <input type="hidden" name="tournamentId" value={t.id} />
                      <Button variant="danger" size="sm" type="submit">
                        Delete
                      </Button>
                    </ConfirmActionForm>
                  </div>
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
