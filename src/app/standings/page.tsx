// src/app/standings/page.tsx
import React from "react";

interface TeamStanding {
  team: string;
  wins: number;
  losses: number;
  points: number;
}

interface Tournament {
  name: string;
  nextMatch: string;
  standings: TeamStanding[];
  leaders: { name: string; score: number }[];
}

const mockTournaments: Tournament[] = [
  {
    name: "Intramural Basketball League",
    nextMatch: "Nov 25, 2025 – 6:30 PM",
    standings: [
      { team: "Warriors", wins: 5, losses: 1, points: 15 },
      { team: "Sharks", wins: 4, losses: 2, points: 12 },
      { team: "Lions", wins: 3, losses: 3, points: 9 },
      { team: "Tigers", wins: 2, losses: 4, points: 6 },
    ],
    leaders: [
      { name: "John Mercado", score: 112 },
      { name: "Kai Ikaika", score: 105 },
      { name: "Lucas Santos", score: 98 },
    ],
  },
  {
    name: "Volleyball Tournament",
    nextMatch: "Nov 26, 2025 – 4:00 PM",
    standings: [
      { team: "Spikers", wins: 6, losses: 0, points: 18 },
      { team: "Aces", wins: 4, losses: 2, points: 12 },
      { team: "Blockers", wins: 3, losses: 3, points: 9 },
    ],
    leaders: [
      { name: "Ava Kanoa", score: 76 },
      { name: "Mia Tanaka", score: 70 },
      { name: "Isabella Lee", score: 64 },
    ],
  },
  {
    name: "Soccer League",
    nextMatch: "Nov 28, 2025 – 3:15 PM",
    standings: [
      { team: "United", wins: 4, losses: 1, points: 13 },
      { team: "Rovers", wins: 4, losses: 2, points: 12 },
      { team: "Kings", wins: 2, losses: 4, points: 6 },
    ],
    leaders: [
      { name: "Diego Ramos", score: 10 },
      { name: "Malik Johnson", score: 8 },
      { name: "Riku Matsuda", score: 7 },
    ],
  },
  {
    name: "Flag Football Championship",
    nextMatch: "Dec 1, 2025 – 8:00 PM",
    standings: [
      { team: "Thunder", wins: 3, losses: 0, points: 9 },
      { team: "Crusaders", wins: 2, losses: 1, points: 6 },
      { team: "Storm", wins: 1, losses: 2, points: 3 },
      { team: "Falcons", wins: 0, losses: 3, points: 0 },
    ],
    leaders: [
      { name: "Mason Hill", score: 320 },
      { name: "Jordan Silva", score: 295 },
      { name: "Kaleo Burton", score: 270 },
    ],
  },
];

export default function StandingsPage() {
  return (
    <main className="container mt-4 mb-5">
      <h1 className="mb-4">Tournament Standings</h1>

      {mockTournaments.map((tournament, index) => (
        <div key={index} className="card mb-4 p-3 shadow-sm">
          <h3 className="mb-2">{tournament.name}</h3>
          <p className="text-muted">
            <strong>Next Match:</strong> {tournament.nextMatch}
          </p>

          {/* Standings Table */}
          <table className="table table-striped mt-3">
            <thead>
              <tr>
                <th>Team</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {tournament.standings.map((team, idx) => (
                <tr key={idx}>
                  <td>{team.team}</td>
                  <td>{team.wins}</td>
                  <td>{team.losses}</td>
                  <td>{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Leaders */}
          <h5 className="mt-4">Top 3 Leaders</h5>
          <ul>
            {tournament.leaders.map((leader, idx) => (
              <li key={idx}>
                {leader.name} — <strong>{leader.score}</strong> pts
              </li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  );
}