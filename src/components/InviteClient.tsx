'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Invitation, Tournament, User } from '@prisma/client';
import { Card, Button } from 'react-bootstrap';
import { acceptInvitation, declineInvitation } from '@/lib/invitationActions';

type InviteWithRelations = Invitation & {
  tournament: Tournament;
  invitedBy: User;
};

type Props = {
  invitation: InviteWithRelations;
};

const InviteClient: React.FC<Props> = ({ invitation }) => {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleAccept = async () => {
    setStatus('working');
    setMessage(null);
    try {
      const result = await acceptInvitation(invitation.token);
      if (result.needsTeamSelection) {
        router.push(`/events/${result.tournamentId}/teams/join?token=${invitation.token}`);
        return;
      }

      setMessage('You are now registered for this event.');
      setStatus('done');
    } catch (err) {
      console.error(err);
      setMessage('Could not accept invitation.');
      setStatus('error');
    }
  };

  const handleDecline = async () => {
    setStatus('working');
    setMessage(null);
    try {
      await declineInvitation(invitation.token);
      setMessage('You declined this invitation.');
      setStatus('done');
    } catch (err) {
      console.error(err);
      setMessage('Could not decline invitation.');
      setStatus('error');
    }
  };

  return (
    <div className="d-flex justify-content-center w-100">
      <Card className="ca-auth-card" style={{ maxWidth: 480 }}>
        <Card.Body>
          <h3 className="text-white mb-3">Event Invitation</h3>
          <p className="text-light mb-1">
            You&apos;ve been invited to:
          </p>
          <p className="text-white fw-semibold mb-1">
            {invitation.tournament.name}
          </p>
          <p className="text-light small mb-3">
            Game: {invitation.tournament.game}
          </p>
          <p className="text-light small mb-4">
            Invited by: {invitation.invitedBy.email}
            <br />
            Sent to: {invitation.invitedEmail}
          </p>

          {message && (
            <div className="text-info small mb-3">
              {message}
            </div>
          )}

          {status !== 'done' && (
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                className="flex-fill"
                onClick={handleAccept}
                disabled={status === 'working'}
              >
                Accept
              </Button>
              <Button
                variant="outline-secondary"
                className="flex-fill"
                onClick={handleDecline}
                disabled={status === 'working'}
              >
                Decline
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default InviteClient;
