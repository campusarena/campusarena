'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

type ParticipantRef = {
  id: number | null;
  label: string;
};

export type BracketMatch = {
  id: number;
  roundNumber: number | null;
  slotIndex: number | null;
  p1: ParticipantRef;
  p2: ParticipantRef;
};

type BracketViewProps = {
  matches: BracketMatch[];
};

export function BracketView({ matches }: BracketViewProps) {
  const rounds = useMemo(() => {
    const byRound = new Map<number, BracketMatch[]>();
    matches.forEach((m) => {
      const round = m.roundNumber ?? 0;
      if (!byRound.has(round)) byRound.set(round, []);
      byRound.get(round)!.push(m);
    });
    // Sort rounds 1..N and sort matches by slotIndex within each.
    return Array.from(byRound.entries())
      .sort(([a], [b]) => a - b)
      .map(([, roundMatches]) =>
        roundMatches.slice().sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0)),
      );
  }, [matches]);

  if (rounds.length === 0) {
    return null;
  }

  return (
    <div className="ca-feature-card mb-4 p-4">
      <h3 className="text-white mb-3">Bracket</h3>
      <div className="d-flex flex-row gap-3 overflow-auto">
        {rounds.map((roundMatches, roundIdx) => (
          <div key={roundIdx} className="d-flex flex-column gap-2">
            <div className="text-center text-light small mb-1">
              Round {roundIdx + 1}
            </div>
            {roundMatches.map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="text-decoration-none text-light"
              >
                <div
                  className="border rounded px-2 py-1 bg-dark text-light small"
                  style={{ minWidth: 180 }}
                >
                  <div>{m.p1.label || 'TBD'}</div>
                  <div className="text-secondary">vs</div>
                  <div>{m.p2.label || 'TBD'}</div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
