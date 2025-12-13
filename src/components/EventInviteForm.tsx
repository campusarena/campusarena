// src/components/events/EventInviteForm.tsx
'use client';

import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { generateEventJoinCode } from '@/lib/invitationActions';

type Props = {
  tournamentId: number;
};

const EventInviteForm: React.FC<Props> = ({ tournamentId }) => {
  const [code, setCode] = useState<string | null>(null);
  const [codeInfo, setCodeInfo] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStatus('loading');
    setErrorMsg(null);
    setCodeInfo(null);

    try {
      const result = await generateEventJoinCode(tournamentId);
      setCode(result.code);
      setCodeInfo(
        result.message ??
          'Join code expires in 7 days.',
      );
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to generate join code. You may not have permission.');
      setStatus('error');
    }
  };

  return (
    <div className="d-flex flex-column gap-2">
      <Button onClick={handleGenerate} disabled={status === 'loading'}>
        {status === 'loading' ? 'Generating…' : 'Generate join code'}
      </Button>

      {errorMsg && <div className="text-danger small">{errorMsg}</div>}

      {code && (
        <div className="small text-light">
          Share this code with participants:
          <div>
            <code className="user-select-all">{code}</code>
          </div>
          {codeInfo && <div className="text-muted">{codeInfo}</div>}
          <div className="text-muted">
            Players can go to the Join page and enter this code to join the event.
          </div>
        </div>
      )}
    </div>
  );
};

export default EventInviteForm;
