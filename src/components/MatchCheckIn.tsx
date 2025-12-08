'use client';

import { useState, useTransition } from 'react';
import { Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { handleCheckIn, handleStartMatch } from '@/app/actions/matchActions';

interface MatchCheckInProps {
  matchId: number;
  participantId: number | null; // The participant ID for the current user
  playerPosition: 'player1' | 'player2' | 'spectator';
  status: string;
  checkIn1: boolean;
  checkIn2: boolean;
  player1Name: string;
  player2Name: string;
}

export default function MatchCheckIn({
  matchId,
  participantId,
  playerPosition,
  status,
  checkIn1,
  checkIn2,
  player1Name,
  player2Name,
}: MatchCheckInProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);

  // Determine user's check-in status
  const isPlayer1 = playerPosition === 'player1';
  const isPlayer2 = playerPosition === 'player2';
  const isSpectator = playerPosition === 'spectator';
  
  const userCheckedIn = isPlayer1 ? checkIn1 : isPlayer2 ? checkIn2 : false;
  const opponentCheckedIn = isPlayer1 ? checkIn2 : isPlayer2 ? checkIn1 : false;
  const bothCheckedIn = checkIn1 && checkIn2;

  const handleCheckInClick = () => {
    if (!participantId) {
      setMessage({ text: 'Participant ID not found', type: 'danger' });
      return;
    }

    startTransition(async () => {
      const result = await handleCheckIn(matchId, participantId);
      
      if (result.success) {
        setMessage({ text: result.message, type: 'success' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ text: result.error || 'Check-in failed', type: 'danger' });
      }
    });
  };

  const handleStartClick = () => {
    startTransition(async () => {
      const result = await handleStartMatch(matchId);
      
      if (result.success) {
        setMessage({ text: result.message, type: 'success' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ text: result.error || 'Failed to start match', type: 'danger' });
      }
    });
  };

  // Render different states
  const renderContent = () => {
    // Match is complete
    if (status === 'COMPLETE') {
      return (
        <div className="text-center p-4">
          <Badge bg="success" className="mb-3 p-2">
            <i className="bi bi-check-circle me-2"></i>
            Match Finished
          </Badge>
          <p className="text-muted mb-0">This match has been completed</p>
        </div>
      );
    }

    // Match is in progress
    if (status === 'IN_PROGRESS') {
      return (
        <div className="text-center p-4">
          <Badge bg="warning" className="mb-3 p-2">
            <i className="bi bi-controller me-2"></i>
            Match In Progress
          </Badge>
          <p className="text-muted mb-0">The match is currently being played</p>
        </div>
      );
    }

    // Match is ready to start
    if (status === 'READY' && bothCheckedIn) {
      return (
        <div className="text-center p-4">
          <Badge bg="info" className="mb-3 p-2">
            <i className="bi bi-check-all me-2"></i>
            Both Players Ready
          </Badge>
          <p className="text-success mb-3">
            <i className="bi bi-check-circle-fill me-1"></i>
            {player1Name} is ready<br />
            <i className="bi bi-check-circle-fill me-1"></i>
            {player2Name} is ready
          </p>
          {!isSpectator && (
            <Button
              variant="success"
              size="lg"
              onClick={handleStartClick}
              disabled={isPending}
              className="w-100"
            >
              {isPending ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Starting Match...
                </>
              ) : (
                <>
                  <i className="bi bi-play-fill me-2"></i>
                  Start Match
                </>
              )}
            </Button>
          )}
        </div>
      );
    }

    // Spectator view
    if (isSpectator) {
      return (
        <div className="text-center p-4">
          <Badge bg="secondary" className="mb-3 p-2">
            <i className="bi bi-eye me-2"></i>
            Spectator View
          </Badge>
          <div className="d-flex justify-content-around mt-3">
            <div>
              <p className="mb-1"><strong>{player1Name}</strong></p>
              {checkIn1 ? (
                <Badge bg="success">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Checked In
                </Badge>
              ) : (
                <Badge bg="secondary">
                  <i className="bi bi-clock me-1"></i>
                  Waiting
                </Badge>
              )}
            </div>
            <div>
              <p className="mb-1"><strong>{player2Name}</strong></p>
              {checkIn2 ? (
                <Badge bg="success">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Checked In
                </Badge>
              ) : (
                <Badge bg="secondary">
                  <i className="bi bi-clock me-1"></i>
                  Waiting
                </Badge>
              )}
            </div>
          </div>
        </div>
      );
    }

    // User hasn't checked in yet
    if (!userCheckedIn) {
      return (
        <div className="text-center p-4">
          <Badge bg="warning" className="mb-3 p-2">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Check-In Required
          </Badge>
          <p className="mb-3">You must check in to participate in this match</p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCheckInClick}
            disabled={isPending}
            className="w-100"
          >
            {isPending ? (
              <>
                <Spinner size="sm" className="me-2" />
                Checking In...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Check In
              </>
            )}
          </Button>
          <small className="text-muted d-block mt-2">
            Match will start once both players check in
          </small>
        </div>
      );
    }

    // User checked in, waiting for opponent
    if (userCheckedIn && !opponentCheckedIn) {
      return (
        <div className="text-center p-4">
          <Badge bg="success" className="mb-3 p-2">
            <i className="bi bi-check-circle-fill me-2"></i>
            You&apos;re Checked In
          </Badge>
          <div className="my-3">
            <Spinner animation="border" variant="secondary" size="sm" className="me-2" />
            <span className="text-muted">Waiting for opponent to check in...</span>
          </div>
          <div className="d-flex justify-content-around mt-3">
            <div>
              <p className="mb-1"><strong>{isPlayer1 ? 'You' : player1Name}</strong></p>
              <Badge bg={checkIn1 ? 'success' : 'secondary'}>
                {checkIn1 ? (
                  <>
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Ready
                  </>
                ) : (
                  <>
                    <i className="bi bi-clock me-1"></i>
                    Waiting
                  </>
                )}
              </Badge>
            </div>
            <div>
              <p className="mb-1"><strong>{isPlayer2 ? 'You' : player2Name}</strong></p>
              <Badge bg={checkIn2 ? 'success' : 'secondary'}>
                {checkIn2 ? (
                  <>
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Ready
                  </>
                ) : (
                  <>
                    <i className="bi bi-clock me-1"></i>
                    Waiting
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="match-checkin-container">
      {message && (
        <Alert 
          variant={message.type} 
          dismissible 
          onClose={() => setMessage(null)}
          className="mb-3"
        >
          {message.text}
        </Alert>
      )}
      
      {renderContent()}
    </div>
  );
}
