// src/components/invitations/JoinClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Form } from 'react-bootstrap';
import { acceptInvitationByCode } from '@/lib/invitationActions';

const JoinClient: React.FC = () => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      const result = await acceptInvitationByCode(code);
      if (result.needsTeamSelection) {
        router.push(`/events/${result.tournamentId}/teams/join?token=${code.trim()}`);
        return;
      }
      setStatus('success');
      setMessage('You have been added to the event (if the code was valid).');
      setCode('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Invalid or expired code, or you are not allowed to join this event.');
    }
  };

  return (
    <Card className="ca-auth-card" style={{ maxWidth: 480, width: '100%' }}>
      <Card.Body>
        <h3 className="text-white mb-3">Join Event</h3>
        <p className="text-light small mb-3">
          Enter the join code provided by the organizer to join a tournament or league.
        </p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Join code</Form.Label>
            <Form.Control
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. a1b2c3d4"
              required
            />
          </Form.Group>

          {message && (
            <div
              className={`small mb-3 ${
                status === 'success' ? 'text-info' : 'text-danger'
              }`}
            >
              {message}
            </div>
          )}

          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Joining…' : 'Join Event'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default JoinClient;
