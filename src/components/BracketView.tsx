'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

type ParticipantRef = {
  id: number | null;
  label: string;
};

export type BracketMatch = {
  id: number;
  bracket?: 'WINNERS' | 'LOSERS' | 'FINALS' | null;
  roundNumber: number | null;
  slotIndex: number | null;
  p1: ParticipantRef;
  p2: ParticipantRef;
};

type BracketViewProps = {
  matches: BracketMatch[];
};

export function BracketView({ matches }: BracketViewProps) {
  const sections = useMemo(() => {
    const byBracket = new Map<'WINNERS' | 'LOSERS' | 'FINALS', BracketMatch[]>();
    for (const m of matches) {
      const bracket = (m.bracket ?? 'WINNERS') as 'WINNERS' | 'LOSERS' | 'FINALS';
      if (!byBracket.has(bracket)) byBracket.set(bracket, []);
      byBracket.get(bracket)!.push(m);
    }

    const toRounds = (ms: BracketMatch[]) => {
      const byRound = new Map<number, BracketMatch[]>();
      ms.forEach((m) => {
        const round = m.roundNumber ?? 0;
        if (!byRound.has(round)) byRound.set(round, []);
        byRound.get(round)!.push(m);
      });

      return Array.from(byRound.entries())
        .sort(([a], [b]) => a - b)
        .map(([, roundMatches]) =>
          roundMatches.slice().sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0)),
        );
    };

    const order: Array<'WINNERS' | 'LOSERS' | 'FINALS'> = ['WINNERS', 'LOSERS', 'FINALS'];
    return order
      .map((key) => ({ key, rounds: toRounds(byBracket.get(key) ?? []) }))
      .filter((s) => s.rounds.length > 0);
  }, [matches]);

  if (sections.length === 0) {
    return null;
  }

  const titleFor = (key: 'WINNERS' | 'LOSERS' | 'FINALS') => {
    if (key === 'LOSERS') return 'Losers Bracket';
    if (key === 'FINALS') return 'Finals';
    return 'Winners Bracket';
  };

  return (
    <div className="ca-feature-card mb-4 p-4">
      <h3 className="text-white mb-3">Bracket</h3>
      <div className="d-flex flex-column gap-3">
        {sections.map((section) => (
          <div key={section.key}>
            <div className="text-light fw-semibold mb-2">{titleFor(section.key)}</div>
            <div className="d-flex flex-row gap-3 overflow-auto">
              {section.rounds.map((roundMatches, roundIdx) => (
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
        ))}
      </div>
    </div>
  );
}
