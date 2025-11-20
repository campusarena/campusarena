"use client";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <section className="ca-dashboard">
      <Container>
        {/* Heading and Create Event button */}
        <Row className="mb-4 text-center">
          <Col>
            <h1 className="fw-bold text-white mb-2">Home Dashboard</h1>
            <p className="ca-dashboard-subtitle">
              See your active leagues, upcoming matches, and recent results in one place.
            </p>

            {/* This is the Create Event button that goes to /create-event */}
            <Link href="/create-event">
              <Button size="lg" className="ca-cta-primary mt-3">
                Create New Event
              </Button>
            </Link>
          </Col>
        </Row>

        {/* Main dashboard card */}
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="ca-dashboard-card">
              <Card.Body>
                {/* Top row: Active Events + Upcoming Matches */}
                <Row className="gy-4 gy-md-0 mb-4">
                  {/* Active Events */}
                  <Col md={6}>
                    <h2 className="ca-dashboard-section-title mb-3">Active Events</h2>

                    <Card className="ca-event-card mb-3">
                      <Card.Body>
                        <div className="ca-dashboard-item-title">
                          Spring Basketball League
                        </div>
                        <div className="ca-dashboard-item-meta">League</div>
                      </Card.Body>
                    </Card>

                    <Card className="ca-event-card">
                      <Card.Body>
                        <div className="ca-dashboard-item-title">
                          Open Smash Tournament
                        </div>
                        <div className="ca-dashboard-item-meta">Tournament</div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Upcoming Matches */}
                  <Col md={6}>
                    <h2 className="ca-dashboard-section-title mb-3">Upcoming Matches</h2>

                    <div className="mb-3">
                      <div className="ca-dashboard-item-title">Monday Night Soccer</div>
                      <div className="ca-dashboard-item-meta">April 29</div>
                      <div className="ca-dashboard-item-meta">Tigers vs Wildcats</div>
                    </div>

                    <div>
                      <div className="ca-dashboard-item-title">
                        Collegiate Dota 2 Championship
                      </div>
                      <div className="ca-dashboard-item-meta">May 1</div>
                      <div className="ca-dashboard-item-meta">
                        Alpha Team vs Group B
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Bottom row: My Next Matches + Recent Results */}
                <Row className="gy-4">
                  {/* My Next Matches */}
                  <Col md={6}>
                    <h3 className="ca-dashboard-section-title mb-3">My Next Matches</h3>

                    <div>
                      <div className="ca-dashboard-item-title">Monday Night Soccer</div>
                      <div className="ca-dashboard-item-meta">April 29</div>
                    </div>
                  </Col>

                  {/* Recent Results */}
                  <Col md={6}>
                    <h3 className="ca-dashboard-section-title mb-3">Recent Results</h3>

                    <div className="mb-3">
                      <div className="ca-dashboard-item-title">
                        Basketball Team A vs Basketball Team D
                      </div>
                      <div className="ca-dashboard-item-meta">Player 1 vs Player 3</div>
                    </div>

                    <div>
                      <div className="ca-dashboard-item-title">Spring League Finals</div>
                      <div className="ca-dashboard-item-meta">
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
