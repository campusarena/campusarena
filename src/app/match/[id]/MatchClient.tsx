// src/app/matches/[id]/MatchClient.tsx
'use client';

import { useState } from 'react';
import { Container, Row, Col, Form, Button, Badge, Breadcrumb } from 'react-bootstrap';
import Link from 'next/link';
import './match.css';

interface PendingMatch {
  id: number;
  p1Score: number;
  p2Score: number;
  winnerParticipantId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

type MatchClientProps = {
  matchId: number;
  tournamentId: number;
  tournamentName: string;
  team1Name?: string | null;
  team2Name?: string | null;
  gameName: string;
  scheduledAt: string | null; // ISO string or null
  hasOrganizerAccess?: boolean;
  reportId: number | null;
  matchStatus: 'PENDING' | 'SCHEDULED' | 'REPORTED' | 'VERIFIED' | 'CANCELED' | 'READY' | 'IN_PROGRESS' | 'COMPLETE';
  initialP1Score: number | null;
  initialP2Score: number | null;
};

export default function MatchClient({
  matchId,
  tournamentId,
  tournamentName,
  team1Name: initialTeam1,
  team2Name: initialTeam2,
  gameName,
  scheduledAt,
  hasOrganizerAccess,
  reportId,
  matchStatus,
  initialP1Score,
  initialP2Score,
}: MatchClientProps) {

  const [team1Name, setTeam1Name] = useState(initialTeam1 || 'Team / Player 1');
  const [team2Name, setTeam2Name] = useState(initialTeam2 || 'Team / Player 2');
  const [team1Score, setTeam1Score] = useState(initialP1Score ?? 0);
  const [team2Score, setTeam2Score] = useState(initialP2Score ?? 0);
  const [isLocked, setIsLocked] = useState(
    matchStatus === 'REPORTED' || matchStatus === 'VERIFIED',
  );
  const [pendingReport, setPendingReport] = useState<PendingMatch | null>(
    reportId
      ? {
          id: reportId,
          p1Score: team1Score,
          p2Score: team2Score,
          winnerParticipantId: 0,
          status: 'PENDING',
        }
      : null,
  );

  const formattedDateTime = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'TBD';

  const handleSubmitMatch = async () => {
    if (!team1Name || !team2Name || team1Score === team2Score) {
      alert('Please enter valid team names and scores (no ties allowed)');
      return;
    }
    try {
      // Tell the server which side won; it will map this to the
      // correct Participant.id based on p1Id / p2Id.
      const winnerSide = team1Score > team2Score ? 'P1' : 'P2';

      const response = await fetch('/api/match/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          p1Score: team1Score,
          p2Score: team2Score,
          winnerSide,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || 'Failed to submit match report');
        return;
      }

      const localReport: PendingMatch = {
        id: data.report.id,
        p1Score: data.report.p1Score,
        p2Score: data.report.p2Score,
        winnerParticipantId: data.report.winnerParticipantId,
        status: data.report.status,
      };

      setPendingReport(localReport);
      setIsLocked(true);

      alert(
        data.message ||
          'Match result submitted successfully. Waiting for organizer verification.',
      );
    } catch (err) {
      console.error('Error submitting match report', err);
      alert('Unexpected error submitting match report');
    }
  };

  return (
    <main style={{ flex: 1, backgroundColor: '#2c2c2c' }}>
      <Container fluid className="match-page py-5">
        <Row className="justify-content-center">
          <Col lg={8} xl={6} className="mb-4">
            {/* Breadcrumb + back to dashboard */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Link
                href="/dashboard"
                className="btn btn-sm btn-outline-light ca-glass-button"
              >
                ← Back to Dashboard
              </Link>

              <Breadcrumb>
                <Breadcrumb.Item linkAs={Link} href="/standings">
                  Tournaments
                </Breadcrumb.Item>

                <Breadcrumb.Item
                  linkAs={Link}
                  href={`/events/${tournamentId}`}
                >
                  {tournamentName}
                </Breadcrumb.Item>

                <Breadcrumb.Item active>Match #{matchId}</Breadcrumb.Item>
              </Breadcrumb>
            </div>

            <h1 className="mb-1 text-white">Report Match Result</h1>
            {/* Show names right under the title */}
            <p className="ca-section-subtitle mb-4">
              {team1Name} vs {team2Name}
            </p>

            {/* Match Status Badge */}
            {isLocked && (
              <div className="mb-3">
                <Badge
                  bg="success"
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  ✓ Match Locked & Submitted for Verification
                </Badge>
              </div>
            )}

            {/* VS Section */}
            <div className="match-vs-section mb-5">
              <div className="team-container">
                <div className="team-box">
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="text"
                      value={team1Name}
                      onChange={(e) => setTeam1Name(e.target.value)}
                      placeholder="Team / Player 1 Name"
                      disabled={isLocked}
                      style={{
                        backgroundColor: '#0d0e13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                      }}
                    />
                  </Form.Group>
                  <div className="team-logo" />
                  <Form.Group>
                    <Form.Control
                      type="number"
                      min="0"
                      value={team1Score}
                      onChange={(e) =>
                        setTeam1Score(parseInt(e.target.value, 10) || 0)
                      }
                      disabled={isLocked}
                      style={{
                        backgroundColor: '#0d0e13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                      }}
                    />
                  </Form.Group>
                </div>

                <div className="vs-divider">VS</div>

                <div className="team-box">
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="text"
                      value={team2Name}
                      onChange={(e) => setTeam2Name(e.target.value)}
                      placeholder="Team / Player 2 Name"
                      disabled={isLocked}
                      style={{
                        backgroundColor: '#0d0e13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                      }}
                    />
                  </Form.Group>
                  <div className="team-logo" />
                  <Form.Group>
                    <Form.Control
                      type="number"
                      min="0"
                      value={team2Score}
                      onChange={(e) =>
                        setTeam2Score(parseInt(e.target.value, 10) || 0)
                      }
                      disabled={isLocked}
                      style={{
                        backgroundColor: '#0d0e13',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                      }}
                    />
                  </Form.Group>
                </div>
              </div>

              <Button
                className="report-score-btn mt-4"
                size="lg"
                onClick={handleSubmitMatch}
                disabled={isLocked}
              >
                {isLocked ? 'MATCH LOCKED' : 'SUBMIT MATCH'}
              </Button>
            </div>

            {/* Match Details Card */}
            <div className="match-details-card">
              <h4 className="mb-3">MATCH DETAILS</h4>
              <div className="detail-row">
                <span className="detail-label">Game</span>
                <span className="detail-value">{gameName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date &amp; Time</span>
                <span className="detail-value">{formattedDateTime}</span>
              </div>
              {pendingReport && (
                <div className="detail-row">
                  <span className="detail-label">Report status</span>
                  <span className="detail-value">{pendingReport.status}</span>
                </div>
              )}

              {hasOrganizerAccess && reportId && (
                <div className="mt-3">
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={async () => {
                      const res = await fetch('/api/match/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reportId, action: 'approve' }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) {
                        alert(data.error || 'Failed to verify match report');
                        return;
                      }
                      alert(data.message || 'Match result verified successfully');
                    }}
                  >
                    Verify Match Result
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={async () => {
                      const res = await fetch('/api/match/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reportId, action: 'reject' }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) {
                        alert(data.error || 'Failed to reject match report');
                        return;
                      }
                      alert(data.message || 'Match result rejected');
                      // Clear local pending state so the form can be edited again.
                      setPendingReport(null);
                      setIsLocked(false);
                    }}
                  >
                    Reject Report
                  </Button>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
