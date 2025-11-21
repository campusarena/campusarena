"use client";

import React from "react";
import { Container, Row, Col, Card, Badge } from "react-bootstrap";

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
    <section className="ca-standings-page">
      <Container>
        {/* Page header */}
        <Row className="mb-5 text-center">
          <Col>
            <h1 className="fw-bold text-white mb-2">Season Standings</h1>
            <p className="ca-section-subtitle">Current local league standings</p>
          </Col>
        </Row>

        {/* League cards */}
        <Row xs={1} md={2} className="g-4">
          {mockTournaments.map((tournament, index) => (
            <Col key={index}>
              <Card className="ca-feature-card h-100">
                <Card.Body>
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-semibold text-white mb-1">
                        {tournament.name}
                      </h5>
                      <div className="ca-section-subtitle small">
                        Next match {tournament.nextMatch}
                      </div>
                    </div>
                    <Badge className="ca-event-tag">Demo league</Badge>
                  </div>

                  {/* Standings table */}
                  <div className="ca-standings-table mt-3">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Team</th>
                          <th className="text-center">W</th>
                          <th className="text-center">L</th>
                          <th className="text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tournament.standings.map((team, idx) => (
                          <tr key={idx}>
                            <td>{team.team}</td>
                            <td className="text-center">{team.wins}</td>
                            <td className="text-center">{team.losses}</td>
                            <td className="text-center">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Top 3 */}
                  <div className="mt-3">
                    <div className="text-secondary text-uppercase small mb-1">
                      Top three
                    </div>
                    <ol className="mb-0 ca-feature-text small ps-3">
                      {tournament.leaders.map((leader, idx) => (
                        <li key={idx} className="d-flex justify-content-between">
                          <span>{leader.name}</span>
                          <span>{leader.score} pts</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}