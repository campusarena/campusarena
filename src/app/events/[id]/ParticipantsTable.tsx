"use client";

import { useState } from "react";
type SortMode = "seed" | "record" | "name";

type ParticipantRecord = {
  participantId: number;
  seed: number | null;
  name: string;
  key: number;
  wins: number;
  losses: number;
};

interface ParticipantsTableProps {
  participants: ParticipantRecord[];
}

export default function ParticipantsTable({ participants }: ParticipantsTableProps) {
  const [sortMode, setSortMode] = useState<SortMode>("seed");

  const sortedParticipants = [...participants].sort((a, b) => {
    if (sortMode === "seed") {
      return (a.seed ?? Number.POSITIVE_INFINITY) -
        (b.seed ?? Number.POSITIVE_INFINITY);
    }

    if (sortMode === "name") {
      const an = (a.name ?? "").toLowerCase();
      const bn = (b.name ?? "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return (a.seed ?? Number.POSITIVE_INFINITY) -
        (b.seed ?? Number.POSITIVE_INFINITY);
    }

    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return (a.seed ?? Number.POSITIVE_INFINITY) -
      (b.seed ?? Number.POSITIVE_INFINITY);
  });

  return (
    <div className="ca-feature-card mb-4 p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-white mb-0">Participants</h3>
        <div className="d-flex align-items-center gap-2">
          <span className="text-light small">Sort by:</span>
          <select
            className="form-select form-select-sm bg-dark text-light border-secondary"
            name="participantSort"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="seed">Seed</option>
            <option value="record">Record (W-L)</option>
            <option value="name">Player / Team (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="ca-standings-table mt-3">
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th className="text-center">Seed</th>
              <th>Player / Team</th>
              <th className="text-center">Record</th>
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.map((p) => (
              <tr key={p.participantId}>
                <td className="text-center">{p.seed}</td>
                <td>{p.name}</td>
                <td className="text-center">{`${p.wins}-${p.losses}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
