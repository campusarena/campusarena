import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import MatchCheckIn from '@/components/MatchCheckIn';
import ReportScoreForm from '@/components/ReportScoreForm';
import Link from 'next/link';
import './match-checkin.css';

interface MatchPageProps {
  params: {
    id: string;
  };
}

async function getMatchData(matchId: number) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      p1: {
        include: {
          user: true,
          team: { include: { members: { include: { user: true } } } },
        },
      },
      p2: {
        include: {
          user: true,
          team: { include: { members: { include: { user: true } } } },
        },
      },
      tournament: true,
      winner: {
        include: {
          user: true,
          team: true,
        },
      },
    },
  });

  return match;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const matchId = parseInt(params.id);
  const match = await getMatchData(matchId);

  if (!match) {
    notFound();
  }

  // Get current user from database
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    redirect('/auth/signin');
  }

  // Determine if user is a participant and which position
  let playerPosition: 'player1' | 'player2' | 'spectator' = 'spectator';
  let participantId: number | null = null;

  // Check if user is player 1
  if (match.p1?.userId === currentUser.id) {
    playerPosition = 'player1';
    participantId = match.p1.id;
  }
  // Check if user is player 2
  else if (match.p2?.userId === currentUser.id) {
    playerPosition = 'player2';
    participantId = match.p2.id;
  }
  // Check if user is in player 1's team
  else if (match.p1?.team) {
    const isInTeam1 = match.p1.team.members.some(
      (member) => member.userId === currentUser.id
    );
    if (isInTeam1) {
      playerPosition = 'player1';
      participantId = match.p1.id;
    }
  }
  // Check if user is in player 2's team
  else if (match.p2?.team) {
    const isInTeam2 = match.p2.team.members.some(
      (member) => member.userId === currentUser.id
    );
    if (isInTeam2) {
      playerPosition = 'player2';
      participantId = match.p2.id;
    }
  }

  // Get player names
  const player1Name = match.p1?.team?.name || match.p1?.user?.email || 'Player 1';
  const player2Name = match.p2?.team?.name || match.p2?.user?.email || 'Player 2';

  return (
    <main className="py-5" style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top left, rgba(91, 141, 255, 0.25) 0, transparent 55%), radial-gradient(circle at bottom right, rgba(255, 79, 163, 0.22) 0, transparent 55%), #050509'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Breadcrumb */}
            <div className="mb-3">
              <small className="text-white-50">Tournaments / {match.tournament.name}</small>
            </div>

            {/* Back Button */}
            <Link href="/match" className="btn btn-outline-light mb-4" style={{ borderRadius: '999px' }}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Matches
            </Link>

            {/* Match Header Card */}
            <div className="card mb-4" style={{ 
              background: '#101116', 
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '1rem',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.03) inset'
            }}>
              <div className="card-body text-white p-4">
                <div className="row align-items-center text-center">
                  {/* Player 1 */}
                  <div className="col-5">
                    <div className="mb-3">
                      <div style={{
                        width: '120px',
                        height: '120px',
                        background: '#0a0b0f',
                        borderRadius: '12px',
                        margin: '0 auto',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)'
                      }}></div>
                    </div>
                    <h4 className="mb-2 text-white">{player1Name}</h4>
                    {match.checkIn1 && (
                      <span className="badge" style={{ 
                        background: 'rgba(34, 197, 94, 0.2)', 
                        color: '#4ade80',
                        padding: '0.5rem 1rem',
                        borderRadius: '999px',
                        fontSize: '0.875rem'
                      }}>
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Checked In
                      </span>
                    )}
                    {match.p1Score !== null && (
                      <div className="mt-2">
                        <h2 className="mb-0 text-white">{match.p1Score}</h2>
                      </div>
                    )}
                  </div>

                  {/* VS */}
                  <div className="col-2">
                    <h3 className="mb-0 text-white-50">VS</h3>
                  </div>

                  {/* Player 2 */}
                  <div className="col-5">
                    <div className="mb-3">
                      <div style={{
                        width: '120px',
                        height: '120px',
                        background: '#0a0b0f',
                        borderRadius: '12px',
                        margin: '0 auto',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)'
                      }}></div>
                    </div>
                    <h4 className="mb-2 text-white">{player2Name}</h4>
                    {match.checkIn2 && (
                      <span className="badge" style={{ 
                        background: 'rgba(34, 197, 94, 0.2)', 
                        color: '#4ade80',
                        padding: '0.5rem 1rem',
                        borderRadius: '999px',
                        fontSize: '0.875rem'
                      }}>
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Checked In
                      </span>
                    )}
                    {match.p2Score !== null && (
                      <div className="mt-2">
                        <h2 className="mb-0 text-white">{match.p2Score}</h2>
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Status Badge */}
                {(match.status === 'REPORTED' || match.status === 'VERIFIED') && (
                  <div className="text-center mt-4">
                    <span className="badge" style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      padding: '0.75rem 2rem',
                      borderRadius: '999px',
                      fontSize: '1rem'
                    }}>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Match Locked & Submitted for Verification
                    </span>
                  </div>
                )}

                {match.status === 'COMPLETE' && match.winner && (
                  <div className="text-center mt-4 p-3" style={{ 
                    background: 'rgba(168, 85, 247, 0.15)',
                    borderRadius: '12px'
                  }}>
                    <p className="mb-0 text-white">
                      <i className="bi bi-trophy-fill text-warning me-2"></i>
                      <strong>Winner: </strong>
                      {match.winner.team?.name || match.winner.user?.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Match Details Card */}
            <div className="card mb-4" style={{ 
              background: '#101116', 
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '1rem',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.03) inset'
            }}>
              <div className="card-body text-white">
                <h5 className="mb-3">MATCH DETAILS</h5>
                <div className="row">
                  <div className="col-6 mb-2">
                    <small className="text-white-50">Game</small>
                    <p className="mb-0">{match.tournament.game}</p>
                  </div>
                  <div className="col-6 mb-2">
                    <small className="text-white-50">Status</small>
                    <p className="mb-0">
                      <span className={`badge bg-${
                        match.status === 'COMPLETE' || match.status === 'VERIFIED'
                          ? 'success'
                          : match.status === 'IN_PROGRESS'
                          ? 'warning'
                          : match.status === 'READY'
                          ? 'info'
                          : 'secondary'
                      }`}>
                        {match.status}
                      </span>
                    </p>
                  </div>
                  {match.roundNumber && (
                    <div className="col-6 mb-2">
                      <small className="text-white-50">Round</small>
                      <p className="mb-0">{match.roundNumber}</p>
                    </div>
                  )}
                  {match.scheduledAt && (
                    <div className="col-6 mb-2">
                      <small className="text-white-50">Date & Time</small>
                      <p className="mb-0">{new Date(match.scheduledAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Check-In Component */}
            <div className="card mb-4" style={{ 
              background: '#101116', 
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '1rem',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.03) inset'
            }}>
              <div className="card-body p-0">
                <MatchCheckIn
                  matchId={match.id}
                  participantId={participantId}
                  playerPosition={playerPosition}
                  status={match.status}
                  checkIn1={match.checkIn1}
                  checkIn2={match.checkIn2}
                  player1Name={player1Name}
                  player2Name={player2Name}
                />
              </div>
            </div>

            {/* Score Report Form - Show when match is IN_PROGRESS or REPORTED */}
            {(match.status === 'IN_PROGRESS' || match.status === 'REPORTED') && 
             playerPosition !== 'spectator' && 
             match.p1 && match.p2 && (
              <div className="mt-4">
                <ReportScoreForm
                  matchId={match.id}
                  player1Name={player1Name}
                  player2Name={player2Name}
                  p1Id={match.p1.id}
                  p2Id={match.p2.id}
                />
              </div>
            )}

            {/* Your Role */}
            <div className="card mt-3" style={{ 
              background: '#101116', 
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '1rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.02) inset'
            }}>
              <div className="card-body">
                <p className="mb-0 text-white">
                  <strong>Your Role:</strong>{' '}
                  {playerPosition === 'spectator' ? (
                    <>
                      <i className="bi bi-eye me-1"></i>
                      Spectator - You are not participating in this match
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-fill me-1"></i>
                      You are {playerPosition === 'player1' ? player1Name : player2Name}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
