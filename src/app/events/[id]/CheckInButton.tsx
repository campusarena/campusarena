'use client';

import { useState, useTransition } from 'react';
import { checkInToTournament } from './check-in-action';

type CheckInButtonProps = {
  tournamentId: number;
};

export function CheckInButton({ tournamentId }: CheckInButtonProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckIn = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await checkInToTournament(tournamentId);
      if (!result.ok && result.error) {
        setMessage(result.error);
      } else {
        setMessage('You are checked in for this event.');
      }
    });
  };

  return (
    <div className="mt-3 d-flex flex-column gap-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-light ca-glass-button"
        onClick={handleCheckIn}
        disabled={pending}
      >
        {pending ? 'Checking in...' : 'Check In'}
      </button>
      {message && <span className="text-light small">{message}</span>}
    </div>
  );
}
