import { getServerSession } from 'next-auth';
import { Col, Container, Row, Table } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { adminProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';

const AdminPage = async () => {
  const session = await getServerSession(authOptions);

  // Ensure only admins can access this page
  adminProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );

  // Sitewide admin should be able to see all users + all tournaments
  const [users, tournaments] = await Promise.all([
    prisma.user.findMany({}),
    prisma.tournament.findMany({
      orderBy: { startDate: 'desc' },
    }),
  ]);

  return (
    <main>
      <Container id="admin-dashboard" fluid className="py-3">
        <Row>
          <Col>
            <h1>Admin Dashboard</h1>
          </Col>
        </Row>

        {/* Tournaments section */}
        <Row className="mt-4">
          <Col>
            <h2>All Tournaments</h2>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Game</th>
                  <th>Format</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td>{tournament.id}</td>
                    <td>{tournament.name}</td>
                    <td>{tournament.game}</td>
                    <td>{tournament.format}</td>
                    <td>{tournament.isTeamBased ? 'Team' : 'Individual'}</td>
                    <td>{tournament.status}</td>
                    <td>
                      {tournament.startDate
                        ? new Date(tournament.startDate).toLocaleString()
                        : '—'}
                    </td>
                    <td>{tournament.location ?? '—'}</td>
                  </tr>
                ))}
                {tournaments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      No tournaments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Col>
        </Row>

        {/* Users section */}
        <Row className="mt-4">
          <Col>
            <h2>All Users</h2>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default AdminPage;
