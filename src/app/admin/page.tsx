import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PendingMatchApprovalsClient from '@/app/admin/PendingMatchApprovalsClient';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';

export default async function AdminPage() {
  const [tournaments, users] = await Promise.all([
    prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        game: true,
        status: true,
        visibility: true,
        createdAt: true,
        _count: { select: { participants: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
    }),
    prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      orderBy: [{ id: 'desc' }],
      take: 10,
    }),
  ]);

  return (
    <main>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">Admin Dashboard</h1>
        <div className="d-flex gap-2 flex-wrap">
          <Link href="/admin/users" className="btn btn-outline-light btn-sm">
            Manage Users
          </Link>
          <Link href="/admin/elo" className="btn btn-outline-light btn-sm">
            View Elo Ratings
          </Link>
          <Link href="/admin/events" className="btn btn-outline-light btn-sm">
            Manage Events
          </Link>
          <Link href="/admin/verify-matches" className="btn btn-primary btn-sm">
            Verify Match Results
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <PendingMatchApprovalsClient />
      </div>

      <Card className="ca-feature-card p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 m-0">Recent Tournaments</h2>
          <Link href="/admin/events" className="btn btn-outline-light btn-sm">
            View All
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-muted">No tournaments in the database.</div>
        ) : (
          <Table responsive hover variant="dark" className="m-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Game</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Participants</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.game}</td>
                  <td>{t.status}</td>
                  <td>{t.visibility}</td>
                  <td>{t._count.participants}</td>
                  <td className="text-end">
                    <Link href={`/admin/events/${t.id}`} className="btn btn-outline-light btn-sm">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="ca-feature-card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 m-0">Recent Users</h2>
          <Link href="/admin/users" className="btn btn-outline-light btn-sm">
            View All
          </Link>
        </div>

        {users.length === 0 ? (
          <div className="text-muted">No users in the database.</div>
        ) : (
          <Table responsive hover variant="dark" className="m-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </main>
  );
}
