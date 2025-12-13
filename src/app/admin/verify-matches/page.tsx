'use client';

import { useEffect, useState } from 'react';
import { Container, Card, Button, Badge, Table, Alert } from 'react-bootstrap';

interface MatchReport {
  id: number;
  matchId: number;
  p1Score: number;
  p2Score: number;
  status: string;
  createdAt: string;
  reportedBy: {
    email: string;
  };
  match: {
    p1: { team?: { name: string } };
    p2: { team?: { name: string } };
  };
}

export default function VerifyMatchesPage() {
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

        {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        {reports.length === 0 ? (
          <Card className="ca-feature-card p-4">
            <p style={{ color: '#c2c5e4', margin: 0 }}>No pending match reports to verify.</p>
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
                {reports.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      {report.match.p1?.team?.name || 'TBD'} vs {report.match.p2?.team?.name || 'TBD'}
                    </td>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      {report.p1Score} - {report.p2Score}
                    </td>
                    <td style={{ border: 'none', padding: '1rem' }}>
                      {report.reportedBy.email}
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
