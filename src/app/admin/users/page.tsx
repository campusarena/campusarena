import { prisma } from '@/lib/prisma';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Link from 'next/link';
import { adminKickUserFromPlatformAction } from '@/lib/adminActions';
import ConfirmActionForm from '@/components/ConfirmActionForm';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: [{ role: 'desc' }, { id: 'asc' }],
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">Admin · Users</h1>
        <div className="d-flex gap-2 flex-wrap">
          <Link href="/admin" className="btn btn-outline-light btn-sm">
            Admin Dashboard
          </Link>
          <Link href="/admin/events" className="btn btn-outline-light btn-sm">
            View Events
          </Link>
        </div>
      </div>

      <Card className="ca-feature-card p-3">
        <Table responsive hover variant="dark" className="m-0">
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ border: 'none', padding: '0.75rem' }}>ID</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Email</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Name</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Role</th>
              <th style={{ border: 'none', padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <td style={{ border: 'none', padding: '0.75rem' }}>{u.id}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{u.email}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{u.name}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>{u.role}</td>
                <td style={{ border: 'none', padding: '0.75rem' }}>
                  <ConfirmActionForm
                    action={adminKickUserFromPlatformAction}
                    confirmMessage={`Kick ${u.email} from the platform? This cannot be undone.`}
                  >
                    <input type="hidden" name="userId" value={u.id} />
                    <Button variant="danger" size="sm" type="submit">
                      Kick From Platform
                    </Button>
                  </ConfirmActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
