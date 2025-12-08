// src/app/matches/[id]/MatchClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Badge, Breadcrumb } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import './match.css';

interface PendingMatch {
  id: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
}

type MatchClientProps = {
  matchId: number;
  tournamentId: number;
  tournamentName: string;
  team1Name?: string | null;
  team2Name?: string | null;
  gameName: string;
  scheduledAt: string | null; // ISO string or null
};

export default function MatchClient({
  matchId,
  tournamentId,
  tournamentName,
  team1Name: initialTeam1,
  team2Name: initialTeam2,
  gameName,
  scheduledAt,
}: MatchClientProps) {
  const { data: session } = useSession();

  const [team1Name, setTeam1Name] = useState(initialTeam1 || 'Team / Player 1');
  const [team2Name, setTeam2Name] = useState(initialTeam2 || 'Team / Player 2');
  const [team1Score, setTeam1Score] = useState(1);
  const [team2Score, setTeam2Score] = useState(1);
  const [isVerified, setIsVerified] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);

  // Prefer name → email → "Anonymous" for submittedBy
  const submittedByLabel =
    (session?.user as { name?: string | null; email?: string | null } | undefined)?.name ??
    session?.user?.email ??
    'Anonymous';

  // Per-match localStorage key so results are scoped to this match
  const storageKey = `campusarena_pending_matches_${matchId}`;

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

  // Load data from localStorage on mount
  const loadData = () => {
    const savedPending = localStorage.getItem(storageKey);
    if (savedPending) {
      setPendingMatches(JSON.parse(savedPending));
      // If something was already submitted for this match, lock the form
      setIsVerified(true);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (pendingMatches.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(pendingMatches));
    }
  }, [pendingMatches, storageKey]);

  const handleSubmitMatch = () => {
    if (!team1Name || !team2Name || team1Score === team2Score) {
      alert('Please enter valid team names and scores (no ties allowed)');
      return;
    }

    const newMatch: PendingMatch = {
      id: Date.now().toString(),
      team1Name,
      team2Name,
      team1Score,
      team2Score,
      status: 'pending',
      submittedBy: submittedByLabel,
    };

    setPendingMatches((prev) => [...prev, newMatch]);
    setIsVerified(true); // Lock the form locally

    // TODO: later replace with server action to create a MatchReport row.
    alert('Match submitted for admin approval!');
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
            {isVerified && (
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
                      disabled={isVerified}
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
                      disabled={isVerified}
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
                      disabled={isVerified}
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
                      disabled={isVerified}
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
                disabled={isVerified}
              >
                {isVerified ? 'MATCH LOCKED' : 'SUBMIT MATCH'}
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
              {pendingMatches.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Last submitted by</span>
                  <span className="detail-value">
                    {pendingMatches[pendingMatches.length - 1].submittedBy}
                  </span>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
