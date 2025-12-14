'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Form } from 'react-bootstrap';

type TeamRow = {
  id: number;
  name: string;
  memberCount: number;
};

export default function TeamJoinClient({
  tournamentId,
  tournamentName,
  token,
  teams,
  canCreateTeam,
  maxTeams,
}: {
  tournamentId: number;
  tournamentName: string;
  token: string;
  teams: TeamRow[];
  canCreateTeam: boolean;
  maxTeams: number | null;
}) {
  const router = useRouter();

  const [joinTeamId, setJoinTeamId] = useState<number | ''>('');
  const [teamName, setTeamName] = useState('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const teamsLabel = useMemo(() => {
    if (maxTeams == null) return null;
    return `${teams.length}/${maxTeams} teams created`;
  }, [maxTeams, teams.length]);

  async function postJson(url: string, body: unknown) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | { success?: boolean; error?: string; tournamentId?: number }
      | null;

    if (!res.ok || !data?.success) {
      throw new Error(data?.error ?? 'Request failed');
    }

    return data;
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      if (!joinTeamId) throw new Error('Select a team.');

      await postJson('/api/team/join', { token, teamId: joinTeamId });
      router.push(`/events/${tournamentId}`);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to join team.');
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      const name = teamName.trim();
      if (!name) throw new Error('Team name is required.');

      await postJson('/api/team/create', { token, name });
      router.push(`/events/${tournamentId}`);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to create team.');
    }
  }

  return (
    <Card className="ca-auth-card" style={{ maxWidth: 520, width: '100%' }}>
      <Card.Body>
        <h3 className="text-white mb-2">Join a Team</h3>
        <p className="text-light small mb-3">
          Event: <span className="text-white">{tournamentName}</span>
          {teamsLabel ? <span className="ms-2">• {teamsLabel}</span> : null}
        </p>

        <div className="d-flex flex-column gap-4">
          <div>
            <h5 className="text-white mb-2">Join existing team</h5>
            <Form onSubmit={handleJoinTeam}>
              <div className="d-flex gap-2">
                <Form.Select
                  value={joinTeamId}
                  onChange={(e) => setJoinTeamId(e.target.value ? Number(e.target.value) : '')}
                  aria-label="Select team"
                  disabled={status === 'loading'}
                >
                  <option value="">Select a team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.memberCount})
                    </option>
                  ))}
                </Form.Select>
                <Button type="submit" disabled={status === 'loading' || !joinTeamId}>
                  Join
                </Button>
              </div>
            </Form>
          </div>

          <div>
            <h5 className="text-white mb-2">Create a new team</h5>
            {!canCreateTeam ? (
              <p className="text-light small mb-0">
                Team slots are full. You can only join an existing team.
              </p>
            ) : (
              <Form onSubmit={handleCreateTeam}>
                <div className="d-flex flex-column gap-2">
                  <Form.Control
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Team name"
                    required
                    disabled={status === 'loading'}
                  />
                  <Button type="submit" disabled={status === 'loading'}>
                    Create Team
                  </Button>
                </div>
              </Form>
            )}
          </div>

          {message && (
            <div className={status === 'error' ? 'text-danger small' : 'text-info small'}>
              {message}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
