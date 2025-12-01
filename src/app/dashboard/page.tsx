'use client';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <section className="ca-section">
      <Container id="dashboard-page">
        {/* Title and main button */}
        <Row className="mb-4 text-center">
          <Col>
            <h1 className="fw-bold text-white mb-2">Home Dashboard</h1>
            <p className="ca-section-subtitle">
              See your active leagues, upcoming matches, and recent results in one place.
            </p>

            {/* Create Event goes to /create-event */}
            <Link href="/create-event">
              <Button size="lg" className="ca-cta-primary mt-3">
                Create New Event
              </Button>
            </Link>
          </Col>
        </Row>

        {/* Main dashboard card */}
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            {/* Use the same style as the hero preview card */}
            <Card className="ca-hero-card">
              <Card.Body>
                {/* Top row: Active Events + Upcoming Matches */}
                <Row className="mb-4">
                  {/* Active Events (top left) */}
                  <Col md={6} className="mb-4 mb-md-0">
                    <h2 className="h5 mb-3 text-white">Active Events</h2>

                    <Card className="ca-event-card mb-2">
                      <Card.Body>
                        <div className="fw-semibold text-white">
                          Spring Basketball League
                        </div>
                        <div className="text-secondary small">League</div>
                      </Card.Body>
                    </Card>

                    <Card className="ca-event-card">
                      <Card.Body>
                        <div className="fw-semibold text-white">
                          Open Smash Tournament
                        </div>
                        <div className="text-secondary small">Tournament</div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Upcoming Matches (top right) */}
                  <Col md={6}>
                    <h2 className="h5 mb-3 text-white">Upcoming Matches</h2>

                    <div className="mb-3">
                      <div className="fw-semibold text-white">Monday Night Soccer</div>
                      <div className="text-secondary small">April 29</div>
                      <div className="text-secondary small">Tigers vs Wildcats</div>
                    </div>

                    <div>
                      <div className="fw-semibold text-white">
                        Collegiate Dota 2 Championship
                      </div>
                      <div className="text-secondary small">May 1</div>
                      <div className="text-secondary small">
                        Alpha Team vs Group B
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Bottom row: My Next Matches + Recent Results */}
                <Row>
                  {/* My Next Matches (bottom left) */}
                  <Col md={6} className="mb-4 mb-md-0">
                    <h3 className="h6 mb-3 text-white">My Next Matches</h3>

                    <div>
                      <div className="fw-semibold text-white">Monday Night Soccer</div>
                      <div className="text-secondary small">April 29</div>
                    </div>
                  </Col>

                  {/* Recent Results (bottom right) */}
                  <Col md={6}>
                    <h3 className="h6 mb-3 text-white">Recent Results</h3>

                    <div className="mb-2">
                      <div className="fw-semibold text-white">
                        Basketball Team A vs Basketball Team D
                      </div>
                      <div className="text-secondary small">
                        Player 1 vs Player 3
                      </div>
                    </div>

                    <div>
                      <div className="fw-semibold text-white">
                        Spring League Finals
                      </div>
                      <div className="text-secondary small">
                        Alpha Squad vs Night Owls
                      </div>
                    </div>
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
