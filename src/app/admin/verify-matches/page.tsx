'use client';

import { useEffect, useState } from 'react';
import { Container, Card, Button, Badge, Table, Alert, Form } from 'react-bootstrap';

interface MatchReport {
  id: number;
  matchId: number;
  p1Score: number;
  p2Score: number;
  status: string;
  createdAt: string;
  reportedBy: {
    email: string;
    name?: string | null;
  };
  match: {
    p1: {
      user?: { name: string } | null;
      team?: { name: string; members?: { user: { name: string } }[] } | null;
    };
    p2: {
      user?: { name: string } | null;
      team?: { name: string; members?: { user: { name: string } }[] } | null;
    };
  };
}

export default function VerifyMatchesPage() {
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const fetchPendingReports = async () => {
    try {
      const response = await fetch('/api/match/pending-reports');
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
      } else {
        setError(data.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('An error occurred while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const qNormalized = q.trim().toLowerCase();
  const filteredReports = qNormalized
    ? reports.filter((report) => {
        const names: string[] = [];
        const p1 = report.match?.p1;
        const p2 = report.match?.p2;

        if (p1?.user?.name) names.push(p1.user.name);
        if (p2?.user?.name) names.push(p2.user.name);

        const p1Members = p1?.team?.members ?? [];
        for (const m of p1Members) {
          if (m?.user?.name) names.push(m.user.name);
        }

        const p2Members = p2?.team?.members ?? [];
        for (const m of p2Members) {
          if (m?.user?.name) names.push(m.user.name);
        }

        return names.some((n) => n.toLowerCase().includes(qNormalized));
      })
    : reports;

  const handleVerify = async (reportId: number, action: 'approve' | 'reject') => {
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/match/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // Refresh the list
        fetchPendingReports();
      } else {
        setError(data.error || 'Failed to process verification');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <p style={{ color: '#f4f4f8' }}>Loading...</p>
      </Container>
    );
  }

  return (
    <div className="ca-section">
      <Container className="py-5">
        <h1 className="mb-4" style={{ color: '#f4f4f8' }}>Verify Match Results</h1>

        <Card className="ca-feature-card p-4 mb-4">
          <Form.Group>
            <Form.Label style={{ color: '#f4f4f8' }}>Search matches by user name</Form.Label>
            <Form.Control
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type a player name…"
              className="ca-auth-input"
            />
          </Form.Group>
        </Card>

        {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        {filteredReports.length === 0 ? (
          <Card className="ca-feature-card p-4">
            <p style={{ color: '#c2c5e4', margin: 0 }}>
              {reports.length === 0 ? 'No pending match reports to verify.' : 'No matches found for that user.'}
            </p>
          </Card>
        ) : (
          <Card className="ca-feature-card p-4">
            <Table responsive variant="dark" style={{ color: '#f4f4f8' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ border: 'none', padding: '1rem' }}>Match</th>
                  <th style={{ border: 'none', padding: '1rem' }}>Score</th>
                  <th style={{ border: 'none', padding: '1rem' }}>Reported By</th>
                  <th style={{ border: 'none', padding: '1rem' }}>Status</th>
                  <th style={{ border: 'none', padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      {report.match.p1?.team?.name || report.match.p1?.user?.name || 'TBD'} vs{' '}
                      {report.match.p2?.team?.name || report.match.p2?.user?.name || 'TBD'}
                    </td>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      {report.p1Score} - {report.p2Score}
                    </td>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      {report.reportedBy.name ? `${report.reportedBy.name} (${report.reportedBy.email})` : report.reportedBy.email}
                    </td>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      <Badge bg={report.status === 'PENDING' ? 'warning' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </td>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      {report.status === 'PENDING' && (
                        <div className="d-flex gap-2">
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleVerify(report.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleVerify(report.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </Container>
    </div>
  );
}
