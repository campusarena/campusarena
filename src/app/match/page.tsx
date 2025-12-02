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
  gameName: string;
  matchDate: string;
  matchTime: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
}

export default function MatchPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === 'admin@foo.com';
  
  const [team1Name, setTeam1Name] = useState('Team Alpha');
  const [team2Name, setTeam2Name] = useState('Team Beta');
  const [team1Score, setTeam1Score] = useState(1);
  const [team2Score, setTeam2Score] = useState(1);
  const [gameName, setGameName] = useState('Super Smash Bros.');
  const [matchDate, setMatchDate] = useState('2024-04-24');
  const [matchTime, setMatchTime] = useState('14:00');
  
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);

  // Load data from localStorage on mount and when storage changes
  const loadData = () => {
    const savedTeams = localStorage.getItem('campusarena_teams');
    const savedPending = localStorage.getItem('campusarena_pending_matches');
    
    if (savedTeams) {
      setTeams(JSON.parse(savedTeams));
    }
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
    if (teams.length > 0) {
      localStorage.setItem('campusarena_teams', JSON.stringify(teams));
    }
  }, [teams]);

  useEffect(() => {
    if (pendingMatches.length > 0) {
      localStorage.setItem('campusarena_pending_matches', JSON.stringify(pendingMatches));
    }
  }, [pendingMatches]);

  const calculateWinPercentage = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return '0.0%';
    return ((wins / total) * 100).toFixed(1) + '%';
  };

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
      gameName,
      matchDate,
      matchTime,
      status: 'pending',
      submittedBy: session?.user?.email || 'Anonymous'
    };

    setPendingMatches(prev => [...prev, newMatch]);
    alert('Match submitted for admin approval!');
  };

  const handleApproveMatch = (matchId: string) => {
    const match = pendingMatches.find(m => m.id === matchId);
    if (!match) return;

    const winner = match.team1Score > match.team2Score ? match.team1Name : match.team2Name;
    const loser = match.team1Score > match.team2Score ? match.team2Name : match.team1Name;

    setTeams(prevTeams => {
      const updatedTeams = [...prevTeams];
      
      // Update or add winner
      const winnerIndex = updatedTeams.findIndex(t => t.name === winner);
      if (winnerIndex >= 0) {
        updatedTeams[winnerIndex].wins++;
      } else {
        updatedTeams.push({ name: winner, wins: 1, losses: 0 });
      }

      // Update or add loser
      const loserIndex = updatedTeams.findIndex(t => t.name === loser);
      if (loserIndex >= 0) {
        updatedTeams[loserIndex].losses++;
      } else {
        updatedTeams.push({ name: loser, wins: 0, losses: 1 });
      }

      // Sort by win percentage
      return updatedTeams.sort((a, b) => {
        const aTotal = a.wins + a.losses;
        const bTotal = b.wins + b.losses;
        const aWinPct = aTotal > 0 ? a.wins / aTotal : 0;
        const bWinPct = bTotal > 0 ? b.wins / bTotal : 0;
        return bWinPct - aWinPct || b.wins - a.wins;
      });
    });

    setPendingMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, status: 'approved' as const } : m
    ));

    alert(`Match approved! ${winner} defeats ${loser}`);
  };

  const handleRejectMatch = (matchId: string) => {
    setPendingMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, status: 'rejected' as const } : m
    ));
    alert('Match rejected');
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const aTotal = a.wins + a.losses;
    const bTotal = b.wins + b.losses;
    const aWinPct = aTotal > 0 ? a.wins / aTotal : 0;
    const bWinPct = bTotal > 0 ? b.wins / bTotal : 0;
    return bWinPct - aWinPct || b.wins - a.wins;
  });

  return (
    <main style={{ flex: 1, backgroundColor: '#2c2c2c' }}>
      <Container fluid className="match-page py-5">
      <Row>
        {/* Left Side - Match Input */}
        <Col lg={6} className="mb-4">
          <div className="breadcrumb-text mb-3">
            Tournaments / {gameName}
          </div>

          <h1 className="mb-5">Match</h1>

          {/* Match Input Form */}
          <div className="match-details-card mb-4">
            <h4 className="mb-3">MATCH SETUP</h4>
            
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#c2c5e4' }}>Game</Form.Label>
              <Form.Control
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                style={{ 
                  backgroundColor: '#0d0e13', 
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff'
                }}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: '#c2c5e4' }}>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    style={{ 
                      backgroundColor: '#0d0e13', 
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff'
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: '#c2c5e4' }}>Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    style={{ 
                      backgroundColor: '#0d0e13', 
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

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

          {/* Match Details Display */}
          <div className="match-details-card">
            <h4 className="mb-3">MATCH DETAILS</h4>
            <div className="detail-row">
              <span className="detail-label">Game</span>
              <span className="detail-value">{gameName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date & Time</span>
              <span className="detail-value">
                {new Date(matchDate + 'T' + matchTime).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>
        </Col>

        {/* Right Side - Standings and Pending Matches */}
        <Col lg={6}>
          {/* Admin - Pending Matches Section */}
          {isAdmin && pendingMatches.filter(m => m.status === 'pending').length > 0 && (
            <div className="mb-5">
              <h2 className="standings-title mb-4">
                Pending Match Approvals 
                <Badge bg="warning" className="ms-2">
                  {pendingMatches.filter(m => m.status === 'pending').length}
                </Badge>
              </h2>
              
              <div className="match-details-card">
                {pendingMatches
                  .filter(m => m.status === 'pending')
                  .map(match => (
                    <div key={match.id} className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong style={{ color: '#f4f4f8' }}>
                          {match.team1Name} ({match.team1Score}) vs {match.team2Name} ({match.team2Score})
                        </strong>
                        <Badge bg={match.team1Score > match.team2Score ? 'success' : 'info'}>
                          {match.team1Score > match.team2Score ? match.team1Name : match.team2Name} Wins
                        </Badge>
                      </div>
                      <div style={{ color: '#c2c5e4', fontSize: '0.85rem' }} className="mb-2">
                        <div>Game: {match.gameName}</div>
                        <div>Date: {new Date(match.matchDate + 'T' + match.matchTime).toLocaleString()}</div>
                        <div>Submitted by: {match.submittedBy}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button 
                          size="sm" 
                          variant="success"
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
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <h2 className="standings-title mb-4">Standings</h2>
          
          <div className="standings-table-wrapper">
            <Table responsive className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>TEAM</th>
                  <th>WINS</th>
                  <th>LOSSES</th>
                  <th>WIN %</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#c2c5e4' }}>
                      No approved matches yet. Submit matches for admin approval.
                    </td>
                  </tr>
                ) : (
                  sortedTeams.map((team, index) => (
                    <tr key={team.name}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="team-cell">
                          <div className="team-icon"></div>
                          <span>{team.name}</span>
                        </div>
                      </td>
                      <td>{team.wins}</td>
                      <td>{team.losses}</td>
                      <td>{calculateWinPercentage(team.wins, team.losses)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </Container>
    </main>
  );
}
