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
  const [sortMode, setSortMode] = useState<SortMode>("record");

  // 🔹 Always compute standings order by record (wins desc, losses asc, seed asc)
  const recordSorted = [...participants].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;

    const seedA = a.seed ?? Number.POSITIVE_INFINITY;
    const seedB = b.seed ?? Number.POSITIVE_INFINITY;
    return seedA - seedB;
  });

  // Map participantId → 1-based place
  const placeById = new Map<number, number>();
  recordSorted.forEach((p, index) => {
    placeById.set(p.participantId, index + 1);
  });

  // What order do we *display* rows in?
  const sortedParticipants = [...participants].sort((a, b) => {
    if (sortMode === "seed") {
      const seedA = a.seed ?? Number.POSITIVE_INFINITY;
      const seedB = b.seed ?? Number.POSITIVE_INFINITY;
      return seedA - seedB;
    }

    if (sortMode === "name") {
      const an = (a.name ?? "").toLowerCase();
      const bn = (b.name ?? "").toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return (a.seed ?? Number.POSITIVE_INFINITY) -
        (b.seed ?? Number.POSITIVE_INFINITY);
    }

    // "record" mode uses same comparator as recordSorted
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    const seedA = a.seed ?? Number.POSITIVE_INFINITY;
    const seedB = b.seed ?? Number.POSITIVE_INFINITY;
    return seedA - seedB;
  });

  const getPlaceLabel = (place: number | undefined): string => {
    if (!place || place > 3) return "";
    if (place === 1) return "1st";
    if (place === 2) return "2nd";
    return "3rd";
  };

  const getRowClassName = (place: number | undefined): string => {
    if (!place || place > 3) return "";
    if (place === 1) return "ca-standings-row-first";
    if (place === 2) return "ca-standings-row-second";
    return "ca-standings-row-third";
  };

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
              <th className="text-center">Place</th>
              <th className="text-center">Seed</th>
              <th>Player / Team</th>
              <th className="text-center">Record</th>
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.map((p) => {
              const place = placeById.get(p.participantId);
              const label = getPlaceLabel(place);
              const rowClass = getRowClassName(place);

              return (
                <tr key={p.participantId} className={rowClass}>
                  <td className="text-center">
                    {label && (
                      <span className={`ca-place-pill ca-place-pill-${place}`}>
                        {label}
                      </span>
                    )}
                  </td>
                  <td className="text-center">{p.seed ?? "—"}</td>
                  <td>{p.name}</td>
                  <td className="text-center">
                    {p.wins}-{p.losses}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
