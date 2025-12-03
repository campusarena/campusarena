'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Form, Button, Badge } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import './match.css';

interface TeamData {
  name: string;
  wins: number;
  losses: number;
}

interface PendingMatch {
  id: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
}

export default function MatchPage() {
  const { data: session } = useSession();
  
  const [team1Name, setTeam1Name] = useState('Team Alpha');
  const [team2Name, setTeam2Name] = useState('Team Beta');
  const [team1Score, setTeam1Score] = useState(1);
  const [team2Score, setTeam2Score] = useState(1);
  
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);

  // Load data from localStorage on mount and when storage changes
  const loadData = () => {
    const savedPending = localStorage.getItem('campusarena_pending_matches');
    
    if (savedPending) {
      setPendingMatches(JSON.parse(savedPending));
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for storage events from other tabs/windows
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll every 2 seconds to catch same-tab changes
    const interval = setInterval(loadData, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (pendingMatches.length > 0) {
      localStorage.setItem('campusarena_pending_matches', JSON.stringify(pendingMatches));
    }
  }, [pendingMatches]);

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
      submittedBy: session?.user?.email || 'Anonymous'
    };

    setPendingMatches(prev => [...prev, newMatch]);
    alert('Match submitted for admin approval!');
  };

  return (
    <main style={{ flex: 1, backgroundColor: '#2c2c2c' }}>
      <Container fluid className="match-page py-5">
      <Row>
        {/* Match Input */}
        <Col lg={12} className="mb-4">
          <h1 className="mb-5">Match</h1>

          {/* VS Section */}
          <div className="match-vs-section mb-5">
            <div className="team-container">
              <div className="team-box">
                <Form.Group className="mb-2">
                  <Form.Control
                    type="text"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    placeholder="Team 1 Name"
                    style={{ 
                      backgroundColor: '#0d0e13', 
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                  />
                </Form.Group>
                <div className="team-logo"></div>
                <Form.Group>
                  <Form.Control
                    type="number"
                    min="0"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                    style={{ 
                      backgroundColor: '#0d0e13', 
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      textAlign: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold'
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
                    placeholder="Team 2 Name"
                    style={{ 
                      backgroundColor: '#0d0e13', 
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                  />
                </Form.Group>
                <div className="team-logo"></div>
                <Form.Group>
                  <Form.Control
                    type="number"
                    min="0"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                    style={{ 
                      backgroundColor: '#0d0e13', 
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      textAlign: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  />
                </Form.Group>
              </div>
            </div>

            <Button 
              className="report-score-btn mt-4" 
              size="lg"
              onClick={handleSubmitMatch}
            >
              SUBMIT MATCH
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
    </main>
  );
}
