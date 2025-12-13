import { prisma } from '@/lib/prisma';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Link from 'next/link';
import { adminDeleteTournamentAction } from '@/lib/adminActions';
import ConfirmActionForm from '@/components/ConfirmActionForm';

export default async function AdminEventsPage() {
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
      </Card>
    </>
  );
}
