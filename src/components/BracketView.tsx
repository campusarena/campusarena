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
  p1Score?: number | null;
  p2Score?: number | null;
  winnerId?: number | null;
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
              {(() => {
                const matchHeight = 84; // px
                const baseGap = 16; // px
                const unit = matchHeight + baseGap;
                const baseCount = section.rounds[0]?.length ?? 0;
                const baseHeight = Math.max(0, baseCount * unit - (baseCount > 0 ? baseGap : 0));

                return section.rounds.map((roundMatches, roundIdx) => {
                  const count = roundMatches.length;
                  const factor = baseCount > 0 && count > 0 ? baseCount / count : 1;

                  return (
                    <div key={roundIdx} className="d-flex flex-column" style={{ minWidth: 180 }}>
                      <div className="text-center text-light small mb-1">Round {roundIdx + 1}</div>
                      <div style={{ position: 'relative', height: baseHeight }}>
                        {roundMatches.map((m, idx) => {
                          const top = (factor * idx + (factor - 1) / 2) * unit;
                          const showScores = m.p1Score != null || m.p2Score != null;
                          const p1IsWinner = !!m.p1.id && m.winnerId != null && m.winnerId === m.p1.id;
                          const p2IsWinner = !!m.p2.id && m.winnerId != null && m.winnerId === m.p2.id;
                          return (
                            <Link
                              key={m.id}
                              href={`/match/${m.id}`}
                              className="text-decoration-none text-light"
                              style={{ position: 'absolute', top, left: 0, right: 0 }}
                            >
                              <div
                                className="border rounded px-2 py-1 bg-dark text-light small"
                                style={{
                                  height: matchHeight,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                }}
                              >
                                <div className="d-flex justify-content-between gap-2">
                                  <span className={p1IsWinner ? 'fw-semibold' : undefined}>
                                    {m.p1.label || 'TBD'}
                                  </span>
                                  {showScores && (
                                    <span className="text-secondary">{m.p1Score ?? ''}</span>
                                  )}
                                </div>
                                <div className="text-secondary">vs</div>
                                <div className="d-flex justify-content-between gap-2">
                                  <span className={p2IsWinner ? 'fw-semibold' : undefined}>
                                    {m.p2.label || 'TBD'}
                                  </span>
                                  {showScores && (
                                    <span className="text-secondary">{m.p2Score ?? ''}</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
