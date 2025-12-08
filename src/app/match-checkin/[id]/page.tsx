import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import MatchCheckIn from '@/components/MatchCheckIn';

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
    <main className="py-5" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Match Header */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h3 className="mb-0">
                  <i className="bi bi-trophy me-2"></i>
                  {match.tournament.name}
                </h3>
              </Card.Header>
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs={5} className="text-center">
                    <h4 className="mb-1">{player1Name}</h4>
                    {match.checkIn1 && (
                      <Badge bg="success">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Checked In
                      </Badge>
                    )}
                  </Col>
                  <Col xs={2} className="text-center">
                    <h5 className="text-muted mb-0">VS</h5>
                  </Col>
                  <Col xs={5} className="text-center">
                    <h4 className="mb-1">{player2Name}</h4>
                    {match.checkIn2 && (
                      <Badge bg="success">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Checked In
                      </Badge>
                    )}
                  </Col>
                </Row>

                {/* Match Info */}
                <div className="mt-4 pt-3 border-top">
                  <Row>
                    <Col xs={6}>
                      <p className="mb-1">
                        <strong>Status:</strong>{' '}
                        <Badge
                          bg={
                            match.status === 'COMPLETE'
                              ? 'success'
                              : match.status === 'IN_PROGRESS'
                              ? 'warning'
                              : match.status === 'READY'
                              ? 'info'
                              : 'secondary'
                          }
                        >
                          {match.status}
                        </Badge>
                      </p>
                    </Col>
                    <Col xs={6}>
                      {match.roundNumber && (
                        <p className="mb-1">
                          <strong>Round:</strong> {match.roundNumber}
                        </p>
                      )}
                    </Col>
                  </Row>
                  {match.status === 'COMPLETE' && match.winner && (
                    <div className="mt-3 p-3 bg-success bg-opacity-10 rounded">
                      <p className="mb-0 text-center">
                        <i className="bi bi-trophy-fill text-warning me-2"></i>
                        <strong>Winner: </strong>
                        {match.winner.team?.name || match.winner.user?.email}
                        {match.p1Score !== null && match.p2Score !== null && (
                          <span className="ms-2">
                            ({match.p1Score} - {match.p2Score})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Check-In Component */}
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Match Check-In
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <MatchCheckIn
                  matchId={match.id}
                  currentUserId={currentUser.id}
                  participantId={participantId}
                  playerPosition={playerPosition}
                  status={match.status}
                  checkIn1={match.checkIn1}
                  checkIn2={match.checkIn2}
                  player1Name={player1Name}
                  player2Name={player2Name}
                />
              </Card.Body>
            </Card>

            {/* Your Role */}
            <Card className="mt-3 shadow-sm">
              <Card.Body>
                <p className="mb-0 text-muted">
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
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
