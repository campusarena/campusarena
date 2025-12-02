'use client';

import { useEffect, useState } from 'react';
import { Col, Container, Row, Table, Button, Badge, Card } from 'react-bootstrap';
import Link from 'next/link';

interface PendingMatch {
  id: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  gameName: string;
  matchDate: string;
  matchTime: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
}

const AdminPage = () => {
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);

  const loadPendingMatches = () => {
    const savedPending = localStorage.getItem('campusarena_pending_matches');
    if (savedPending) {
      const allMatches = JSON.parse(savedPending);
      setPendingMatches(allMatches.filter((m: PendingMatch) => m.status === 'pending'));
    }
  };

  useEffect(() => {
    loadPendingMatches();
    
    // Refresh data every 2 seconds to catch changes from other tabs
    const interval = setInterval(loadPendingMatches, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveMatch = (matchId: string) => {
    const savedPending = localStorage.getItem('campusarena_pending_matches');
    if (!savedPending) return;

    const allMatches: PendingMatch[] = JSON.parse(savedPending);
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return;

    // Update match status to approved
    const updatedMatches = allMatches.map(m => 
      m.id === matchId ? { ...m, status: 'approved' as const } : m
    );
    localStorage.setItem('campusarena_pending_matches', JSON.stringify(updatedMatches));

    // Update standings
    const winner = match.team1Score > match.team2Score ? match.team1Name : match.team2Name;
    const loser = match.team1Score > match.team2Score ? match.team2Name : match.team1Name;

    const savedTeams = localStorage.getItem('campusarena_teams');
    const teams = savedTeams ? JSON.parse(savedTeams) : [];

    // Update or add winner
    const winnerIndex = teams.findIndex((t: { name: string; wins: number; losses: number }) => t.name === winner);
    if (winnerIndex >= 0) {
      teams[winnerIndex].wins++;
    } else {
      teams.push({ name: winner, wins: 1, losses: 0 });
    }

    // Update or add loser
    const loserIndex = teams.findIndex((t: { name: string; wins: number; losses: number }) => t.name === loser);
    if (loserIndex >= 0) {
      teams[loserIndex].losses++;
    } else {
      teams.push({ name: loser, wins: 0, losses: 1 });
    }

    localStorage.setItem('campusarena_teams', JSON.stringify(teams));

    // Update local state
    setPendingMatches(prev => prev.filter(m => m.id !== matchId));
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
    
    alert(`Match approved! ${winner} defeats ${loser}`);
  };

  const handleRejectMatch = (matchId: string) => {
    const savedPending = localStorage.getItem('campusarena_pending_matches');
    if (!savedPending) return;

    const allMatches: PendingMatch[] = JSON.parse(savedPending);
    const updatedMatches = allMatches.map(m => 
      m.id === matchId ? { ...m, status: 'rejected' as const } : m
    );
    localStorage.setItem('campusarena_pending_matches', JSON.stringify(updatedMatches));

    setPendingMatches(prev => prev.filter(m => m.id !== matchId));
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
    
    alert('Match rejected');
  };

  return (
    <main>
      <Container id="admin-dashboard" fluid className="py-3">
        <Row>
          <Col>
            <h1>Admin Dashboard</h1>
            <Link href="/admin/verify-matches" passHref legacyBehavior>
              <Button variant="primary" className="mt-2">Verify Match Results (Database)</Button>
            </Link>
          </Col>
        </Row>

        {/* Pending Match Approvals Section */}
        {pendingMatches.length > 0 && (
          <Row className="mt-4">
            <Col>
              <h2>
                Pending Match Approvals 
                <Badge bg="warning" className="ms-2">{pendingMatches.length}</Badge>
              </h2>
              <Card className="p-3">
                {pendingMatches.map(match => (
                  <div key={match.id} className="mb-3 pb-3" style={{ borderBottom: '1px solid #dee2e6' }}>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <h5 className="mb-1">
                          {match.team1Name} ({match.team1Score}) vs {match.team2Name} ({match.team2Score})
                        </h5>
                        <div className="text-muted small">
                          <div><strong>Game:</strong> {match.gameName}</div>
                          <div><strong>Date:</strong> {new Date(match.matchDate + 'T' + match.matchTime).toLocaleString()}</div>
                          <div><strong>Submitted by:</strong> {match.submittedBy}</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <Badge bg={match.team1Score > match.team2Score ? 'success' : 'info'} className="p-2">
                          Winner: {match.team1Score > match.team2Score ? match.team1Name : match.team2Name}
                        </Badge>
                      </Col>
                      <Col md={3} className="text-end">
                        <Button 
                          size="sm" 
                          variant="success"
                          className="me-2"
                          onClick={() => handleApproveMatch(match.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger"
                          onClick={() => handleRejectMatch(match.id)}
                        >
                          Reject
                        </Button>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        )}

        {/* Tournaments section */}
        <Row className="mt-4">
          <Col>
            <h2>All Tournaments</h2>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Info</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-muted">No tournaments in database yet. Use Prisma Studio to add tournaments.</td>
                </tr>
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
                  <th>Info</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-muted">User data available via database queries.</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default AdminPage;
