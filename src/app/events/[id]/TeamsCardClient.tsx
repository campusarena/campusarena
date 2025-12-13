'use client';

import { useState } from 'react';

type TeamMemberRow = {
  id: number;
  name: string | null;
  email: string;
};

type TeamRow = {
  id: number;
  name: string;
  members: TeamMemberRow[];
};

export default function TeamsCardClient({ teams }: { teams: TeamRow[] }) {
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  if (teams.length === 0) {
    return <p className="text-light mb-0">No teams yet.</p>;
  }

  return (
    <div className="row g-3">
      {teams.map((team) => {
        const isExpanded = expandedTeamId === team.id;
        const memberCount = team.members.length;

        return (
          <div key={team.id} className="col-12 col-md-6 col-lg-4">
            <button
              type="button"
              className="w-100 text-start p-0 border-0 bg-transparent"
              onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
              aria-expanded={isExpanded}
            >
              <div className="ca-feature-card p-3 h-100">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <div className="text-white fw-semibold">{team.name}</div>
                    <div className="text-light small">{memberCount} member{memberCount === 1 ? '' : 's'}</div>
                  </div>
                  <div className="text-light small">{isExpanded ? '−' : '+'}</div>
                </div>

                {isExpanded && (
                  <div className="mt-3">
                    {team.members.length === 0 ? (
                      <div className="text-light small">No members</div>
                    ) : (
                      <ul className="mb-0 ps-3 text-light small">
                        {team.members.map((m) => (
                          <li key={m.id}>{m.name ?? m.email}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
