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

export interface EventListing {
  id: number;
  name: string;
  game: string;
  nextMatch: string;
  standings: TeamStanding[];
}

interface EventsClientProps {
  events: EventListing[];
}

export default function EventsClient({ events }: EventsClientProps) {
  return (
    <section className="ca-standings-page">
      <Container>
        {/* Back to dashboard */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="btn btn-sm btn-outline-light ca-glass-button"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <Row className="mb-5 text-center">
          <Col>
            <h1 className="fw-bold text-white mb-2">Your Events</h1>
            <p className="ca-section-subtitle">
              Events you are participating in or managing
            </p>
          </Col>
        </Row>

        {/* Event Cards */}
        <Row xs={1} md={2} className="g-4 justify-content-center">
          {events.map((event) => {
            // Deduplicate standings
            const map = new Map<string, TeamStanding>();

            event.standings.forEach((entry) => {
              const existing = map.get(entry.team);
              if (!existing) map.set(entry.team, { ...entry });
              else {
                existing.wins += entry.wins;
                existing.losses += entry.losses;
                existing.points += entry.points;
              }
            });

            const standings = Array.from(map.values()).sort(
              (a, b) => b.points - a.points
            );

            return (
              <Col key={event.id} md={10} lg={8}>
                <Card className="ca-feature-card w-100 h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-semibold text-white mb-1">
                          {event.name}
                        </h5>
                        <p className="ca-section-subtitle small mb-0">
                          Next match {event.nextMatch}
                        </p>
                      </div>
                      <Badge className="ca-event-tag">Event</Badge>
                    </div>

                    {/* Standings */}
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
                          {standings.map((team, idx) => (
                            <tr key={team.team}>
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

                    <div className="mt-3 text-end">
                      <Link
                        href={`/events/${event.id}`}
                        className="btn btn-sm btn-outline-light"
                      >
                        View Details
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
}
