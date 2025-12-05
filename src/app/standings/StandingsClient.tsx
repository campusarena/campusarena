"use client";

import React from "react";
import { Container, Row, Col, Card, Badge } from "react-bootstrap";
import Link from "next/link";

export interface TeamStanding {
  team: string;
  wins: number;
  losses: number;
  points: number;
}

export interface TournamentStanding {
  id: number;
  name: string;
  game: string;
  nextMatch: string;
  standings: TeamStanding[];
}

interface StandingsClientProps {
  tournaments: TournamentStanding[];
}

export default function StandingsClient({ tournaments }: StandingsClientProps) {
  return (
    <section className="ca-standings-page">
      <Container>
        {/* Return to Dashboard */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="btn btn-sm btn-outline-light ca-glass-button"
          >
            ← Back to dashboard
          </Link>
        </div>

        {/* Page header */}
        <Row className="mb-5 text-center">
          <Col>
            <h1 className="fw-bold text-white mb-2">Season Standings</h1>
            <p className="ca-section-subtitle">
              Current local league standings
            </p>
          </Col>
        </Row>

        {/* League cards */}
        <Row
          xs={1}
          md={2}
          className="g-4 justify-content-center"
        >
          {tournaments.map((tournament) => (
            <Col
              key={tournament.id}
              md={10}
              lg={8}
              className="d-flex justify-content-center"
            >
              <Card className="ca-feature-card w-100 h-100">
                <Card.Body>
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-semibold text-white mb-1">
                        {tournament.name}
                      </h5>
                      <p className="ca-section-subtitle small mb-0">
                        Next match {tournament.nextMatch}
                      </p>
                    </div>
                    <Badge className="ca-event-tag">Demo league</Badge>
                  </div>

                  {/* Standings table */}
                  <div className="ca-standings-table ca mt-3">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th className="text-center">#</th>
                          <th>Team</th>
                          <th className="text-center">W</th>
                          <th className="text-center">L</th>
                          <th className="text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tournament.standings.map((team, idx) => (
                          <tr key={idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td>{team.team}</td>
                            <td className="text-center">{team.wins}</td>
                            <td className="text-center">{team.losses}</td>
                            <td className="text-center">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Details button */}
                  <div className="mt-3 text-end">
                    <Link
                      href={`/events/${tournament.id}`}
                      className="btn btn-sm btn-outline-light"
                    >
                      View details
                    </Link>
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