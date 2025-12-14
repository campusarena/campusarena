// src/components/dashboard/DashboardClient.tsx
'use client';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Link from 'next/link';

import type { DashboardData, DashboardEvent } from '@/types/dashboard';

type DashboardClientProps = {
  data: DashboardData;
};

// Allow optional extra fields on events without breaking the base type
type EnrichedEvent = DashboardEvent & {
  game?: string | null;
  roleLabel?: string | null;
};

export default function DashboardClient({ data }: DashboardClientProps) {
  const { userName, activeEvents, upcomingMatches, recentResults } = data;

  return (
    <section className="ca-section">
      <Container id="dashboard-page">
        {/* ---------- HEADER & ACTION BUTTONS ---------- */}
        <Row className="mb-4 text-center">
          <Col>
            <h1 className="fw-bold text-white mb-2">
              Welcome, {userName}
            </h1>
            <p className="ca-section-subtitle">
              See your active leagues, upcoming matches, and recent results in one place.
            </p>

            <div className="mt-4 d-flex flex-wrap justify-content-center gap-3">
              {/* Create Event */}
              <Link href="/createevent">
                <Button size="lg" className="ca-cta-primary">
                  Create Event
                </Button>
              </Link>

              {/* Join Event */}
              <Link href="/join">
                <Button
                  size="lg"
                  variant="outline-light"
                  className="ca-cta-secondary"
                >
                  Join Event
                </Button>
              </Link>

              {/* View Events */}
              <Link href="/events">
                <Button
                  size="lg"
                  variant="outline-light"
                  className="ca-cta-secondary"
                >
                  Events
                </Button>
              </Link>
            </div>
          </Col>
        </Row>

        {/* ---------- MAIN DASHBOARD CARD ---------- */}
        <Row className="justify-content-center">
          <Col md={10} lg={12}>
            <Card className="ca-hero-card">
              <Card.Body>
                {/* ----- TOP ROW: ACTIVE EVENTS + UPCOMING MATCHES ----- */}
                <Row className="mb-4">
                  {/* Active Events */}
                  <Col md={6} className="mb-4 mb-md-0">
                    <h2 className="h5 mb-3 text-white">Active Events</h2>

                    {activeEvents.map((raw) => {
                      const ev = raw as EnrichedEvent;

                      return (
                        <Link
                          key={ev.id}
                          href={`/events/${ev.id}`}
                          className="text-decoration-none"
                        >
                          <Card
                            className="ca-event-card mb-2 ca-event-card-clickable"
                            role="link"
                          >
                            <Card.Body className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold text-white">
                                  {ev.name}
                                </div>
                                {ev.game && (
                                  <div className="text-secondary small">
                                    {ev.game}
                                  </div>
                                )}
                              </div>

                              <div className="text-end">
                                <Badge
                                  bg="light"
                                  text="dark"
                                  className="small px-3 py-1 rounded-pill"
                                >
                                  {ev.roleLabel ?? ev.kind}
                                </Badge>
                              </div>
                            </Card.Body>
                          </Card>
                        </Link>
                      );
                    })}

                    {activeEvents.length === 0 && (
                      <div className="text-secondary small">
                        You are not registered in any events yet.
                      </div>
                    )}
                  </Col>

                  {/* Upcoming Matches */}
                  <Col md={6}>
                    <h2 className="h5 mb-3 text-white">Upcoming Matches</h2>

                    {upcomingMatches.map((m) => (
                      <div key={m.id} className="mb-3 ca-event-card p-3">
                        <div className="fw-semibold text-white mb-1">
                          {m.name}
                        </div>
                        <div className="text-secondary small">{m.date}</div>
                        {m.description && (
                          <div className="text-secondary small mb-2">
                            {m.description}
                          </div>
                        )}

                        {/* Link to the unique match page */}
                        <Link href={`/match/${m.id}`}>
                          <Button
                            size="sm"
                            variant="outline-light"
                            className="ca-glass-button"
                          >
                            View / Report
                          </Button>
                        </Link>
                      </div>
                    ))}

                    {upcomingMatches.length === 0 && (
                      <div className="text-secondary small">
                        No upcoming matches scheduled.
                      </div>
                    )}
                  </Col>
                </Row>

                {/* ----- BOTTOM FULL-WIDTH: RECENT RESULTS ----- */}
                <Row>
                  <Col>
                    <h3 className="h6 mb-3 text-white">Recent Results</h3>

                    {recentResults.map((r) => (
                      <div key={r.id} className="mb-2">
                        <div className="fw-semibold text-white">{r.name}</div>
                        <div className="text-secondary small">
                          {r.description}
                        </div>
                      </div>
                    ))}

                    {recentResults.length === 0 && (
                      <div className="text-secondary small">
                        No results recorded yet.
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
