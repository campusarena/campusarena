'use client';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Link from 'next/link';

import type { DashboardData } from '@/types/dashboard';

type DashboardClientProps = {
  data: DashboardData;
};

export default function DashboardClient({ data }: DashboardClientProps) {
  const { activeEvents, upcomingMatches, recentResults } = data;

  return (
    <section className="ca-section">
      <Container id="dashboard-page">
        
        {/* ---------- HEADER & ACTION BUTTONS ---------- */}
        <Row className="mb-4 text-center">
          <Col>
            <h1 className="fw-bold text-white mb-2">Home Dashboard</h1>
            <p className="ca-section-subtitle">
              See your active leagues, upcoming matches, and recent results in one place.
            </p>

            {/* Main action buttons */}
            <div className="mt-4 d-flex flex-wrap justify-content-center gap-3">

              {/* Create Event */}
              <Link href="/createevent">
                <Button size="lg" className="ca-cta-primary">
                  Create New Event
                </Button>
              </Link>

              {/* View Matches */}
              <Link href="/match">
                <Button
                  size="lg"
                  variant="outline-light"
                  className="ca-cta-secondary"
                >
                  Matches
                </Button>
              </Link>

              {/* View Standings */}
              <Link href="/standings">
                <Button
                  size="lg"
                  variant="outline-light"
                  className="ca-cta-secondary"
                >
                  Standings
                </Button>
              </Link>

            </div>
          </Col>
        </Row>

        {/* ---------- MAIN DASHBOARD CARD ---------- */}
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="ca-hero-card">
              <Card.Body>

                {/* ----- TOP ROW: ACTIVE EVENTS + UPCOMING MATCHES ----- */}
                <Row className="mb-4">

                  {/* Active Events */}
                  <Col md={6} className="mb-4 mb-md-0">
                    <h2 className="h5 mb-3 text-white">Active Events</h2>

                    {activeEvents.map((ev) => (
                      <Card key={ev.id} className="ca-event-card mb-2">
                        <Card.Body>
                          <div className="fw-semibold text-white">{ev.name}</div>
                          <div className="text-secondary small">{ev.kind}</div>
                        </Card.Body>
                      </Card>
                    ))}
                  </Col>

                  {/* Upcoming Matches */}
                  <Col md={6}>
                    <h2 className="h5 mb-3 text-white">Upcoming Matches</h2>

                    {upcomingMatches.map((m) => (
                      <div key={m.id} className="mb-3">
                        <div className="fw-semibold text-white">{m.name}</div>
                        <div className="text-secondary small">{m.date}</div>
                        {m.description && (
                          <div className="text-secondary small">{m.description}</div>
                        )}
                      </div>
                    ))}
                  </Col>

                </Row>

                {/* ----- BOTTOM FULL-WIDTH: RECENT RESULTS ----- */}
                <Row>
                  <Col>
                    <h3 className="h6 mb-3 text-white">Recent Results</h3>

                    {recentResults.map((r) => (
                      <div key={r.id} className="mb-2">
                        <div className="fw-semibold text-white">{r.name}</div>
                        <div className="text-secondary small">{r.description}</div>
                      </div>
                    ))}
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
