'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export type EditableMatchSummary = {
  id: number;
  roundNumber: number | null;
  slotIndex: number | null;
  p1Label: string;
  p2Label: string;
};

export default function EditMatchScoreClient({
  matches,
}: {
  matches: EditableMatchSummary[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [matchId, setMatchId] = useState<number | ''>('');
  const [p1Score, setP1Score] = useState<string>('');
  const [p2Score, setP2Score] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = useMemo(
    () => matches.find((m) => m.id === matchId) ?? null,
    [matches, matchId],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!matchId) {
      setError('Select a match.');
      return;
    }

    const p1 = Number(p1Score);
    const p2 = Number(p2Score);

    if (!Number.isInteger(p1) || !Number.isInteger(p2) || p1 < 0 || p2 < 0) {
      setError('Scores must be non-negative integers.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/match/edit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, p1Score: p1, p2Score: p2 }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!res.ok) {
        setError(data?.error ?? 'Failed to edit match score.');
        return;
      }

      setP1Score('');
      setP2Score('');
      setMatchId('');
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        className="btn btn-sm btn-outline-light ca-glass-button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? 'Close Score Editor' : 'Edit Match Score'}
      </button>

      {open && (
        <form onSubmit={onSubmit} className="mt-3 d-flex flex-column gap-2">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: 420 }}
              value={matchId}
              onChange={(e) =>
                setMatchId(e.target.value ? Number(e.target.value) : '')
              }
              aria-label="Select match"
            >
              <option value="">Select match…</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  Round {m.roundNumber ?? '?'} • {m.p1Label} vs {m.p2Label}
                </option>
              ))}
            </select>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              <label className="text-light small">{selected?.p1Label ?? 'P1'}</label>
              <input
                type="number"
                min={0}
                step={1}
                className="form-control form-control-sm"
                style={{ width: 90 }}
                value={p1Score}
                onChange={(e) => setP1Score(e.target.value)}
                required
                aria-label="P1 score"
              />
              <span className="text-light small">-</span>
              <input
                type="number"
                min={0}
                step={1}
                className="form-control form-control-sm"
                style={{ width: 90 }}
                value={p2Score}
                onChange={(e) => setP2Score(e.target.value)}
                required
                aria-label="P2 score"
              />
              <label className="text-light small">{selected?.p2Label ?? 'P2'}</label>
            </div>

            <button
              type="submit"
              className="btn btn-sm btn-outline-light ca-glass-button"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save & Verify'}
            </button>
          </div>

          <p className="text-light small mb-0">
            Editing verifies this match and, if the winner changes, resets downstream matches.
          </p>

          {error && <p className="text-warning small mb-0">{error}</p>}
        </form>
      )}
    </div>
  );
}
