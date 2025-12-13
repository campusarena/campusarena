"use client";

import { Container, Row, Col, Card, Badge, Button } from "react-bootstrap";
import {
  Trophy,
  Calendar3,
  People,
  ClipboardCheck,
  GraphUpArrow,
  Lightning,
} from "react-bootstrap-icons";
import Link from "next/link";

export default function FeaturesPage() {
  const sampleEvents = [
    {
      id: 1,
      name: "Smash Bros. Championship",
      game: "Super Smash Bros. Ultimate",
      date: "Dec 15 · 3:00 PM",
      participants: "24/32",
      tag: "Esports",
    },
    {
      id: 2,
      name: "Intramural Soccer League",
      game: "Outdoor Soccer",
      date: "Every Friday · 7:00 PM",
      participants: "12/16",
      tag: "Sports",
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="ca-hero" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-2 fw-bold mb-4 text-white">
                Campus competition, <br />
                made easy.
              </h1>
              <p className="lead ca-hero-subtitle fs-4">
                Create tournaments, join leagues, track standings—all in one place for your campus community.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FEATURE 1: Browse & Join Events */}
      <section className="ca-section py-5">
        <Container>
          <Row className="align-items-center mb-5">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="mb-4">
                <Trophy size={48} className="text-primary mb-3" style={{ color: "#3b82f6" }} />
                <h2 className="display-5 fw-bold text-white mb-3">
                  Find your next competition
                </h2>
                <p className="fs-5 ca-section-subtitle">
                  Browse public tournaments and leagues for sports and esports. From Smash Bros. to soccer, 
                  find events that match your interests and skill level.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <Card className="ca-feature-card">
                <Card.Body className="p-4">
                  {sampleEvents.map((ev) => (
                    <Card key={ev.id} className="ca-event-card mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold text-white mb-1">{ev.name}</div>
                            <div className="text-secondary small">{ev.game}</div>
                            <div className="text-secondary small mt-1">{ev.date}</div>
                          </div>
                          <div className="text-end">
                            <Badge className="ca-event-tag mb-1">{ev.tag}</Badge>
                            <div className="text-secondary small">{ev.participants}</div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                  <Button className="ca-cta-primary w-100 mt-2">View All Events</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FEATURE 2: Create Tournaments (Reversed) */}
      <section className="ca-section py-5">
        <Container>
          <Row className="align-items-center mb-5 flex-column-reverse flex-lg-row">
            <Col lg={6}>
              <Card className="ca-feature-card">
                <Card.Body className="p-4">
                  <h5 className="text-white mb-3">Tournament Settings</h5>
                  <div className="mb-3">
                    <div className="text-secondary small mb-1">Tournament Format</div>
                    <Badge bg="secondary" className="me-2">Single Elimination</Badge>
                    <Badge bg="dark">Team-Based</Badge>
                  </div>
                  <div className="mb-3">
                    <div className="text-secondary small mb-1">Visibility</div>
                    <div className="text-white">🌐 Public Event</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-secondary small mb-1">Participants</div>
                    <div className="text-white">Up to 32 players/teams</div>
                  </div>
                  <div className="text-secondary small">
                    Automatic bracket generation • Match scheduling • Seeding system
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="mb-4">
                <Calendar3 size={48} className="text-primary mb-3" style={{ color: "#3b82f6" }} />
                <h2 className="display-5 fw-bold text-white mb-3">
                  Launch tournaments in minutes
                </h2>
                <p className="fs-5 ca-section-subtitle">
                  Set up single-elimination brackets with automatic seeding, scheduling, and bracket generation. 
                  Configure settings, invite players, and start competing.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FEATURE 3: Match Management */}
      <section className="ca-section py-5">
        <Container>
          <Row className="align-items-center mb-5">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="mb-4">
                <People size={48} className="text-primary mb-3" style={{ color: "#3b82f6" }} />
                <h2 className="display-5 fw-bold text-white mb-3">
                  Every match gets its own page
                </h2>
                <p className="fs-5 ca-section-subtitle">
                  Check in before your match, view opponent details, and report scores. 
                  Organizers verify results to keep everything fair and transparent.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <Card className="ca-feature-card">
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <h5 className="text-white mb-3">Match #4 - Semifinals</h5>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="text-center">
                        <div className="text-white fw-bold">Team Alpha</div>
                        <Badge bg="success" className="mt-1">Checked In</Badge>
                      </div>
                      <div className="text-white fw-bold fs-4">VS</div>
                      <div className="text-center">
                        <div className="text-white fw-bold">Team Beta</div>
                        <Badge bg="warning" className="mt-1">Pending</Badge>
                      </div>
                    </div>
                    <div className="text-secondary small text-center mb-3">Today at 4:00 PM</div>
                    <Button className="ca-cta-primary w-100">Check In</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FEATURE 4: Score Reporting (Reversed) */}
      <section className="ca-section py-5">
        <Container>
          <Row className="align-items-center mb-5 flex-column-reverse flex-lg-row">
            <Col lg={6}>
              <Card className="ca-feature-card">
                <Card.Body className="p-4">
                  <h5 className="text-white mb-4">Report Match Result</h5>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-white">Team Alpha</span>
                      <span className="text-white fw-bold">3</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-white">Team Beta</span>
                      <span className="text-white fw-bold">1</span>
                    </div>
                  </div>
                  <div className="border-top border-secondary pt-3 mb-3">
                    <div className="text-secondary small mb-2">Winner</div>
                    <Badge bg="success">Team Alpha</Badge>
                  </div>
                  <Button className="ca-cta-primary w-100">Submit Result</Button>
                  <div className="text-secondary small text-center mt-2">
                    Pending admin verification
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="mb-4">
                <ClipboardCheck size={48} className="text-primary mb-3" style={{ color: "#3b82f6" }} />
                <h2 className="display-5 fw-bold text-white mb-3">
                  Report and verify scores
                </h2>
                <p className="fs-5 ca-section-subtitle">
                  Players submit match results directly through the app. Tournament organizers 
                  review and approve scores to maintain competitive integrity.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FEATURE 5: Standings & Stats */}
      <section className="ca-section py-5">
        <Container>
          <Row className="align-items-center mb-5">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="mb-4">
                <GraphUpArrow size={48} className="text-primary mb-3" style={{ color: "#3b82f6" }} />
                <h2 className="display-5 fw-bold text-white mb-3">
                  Track your progress
                </h2>
                <p className="fs-5 ca-section-subtitle">
                  View live standings, bracket positions, and match history. See how you stack up 
                  against other competitors and track your performance over time.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <Card className="ca-feature-card">
                <Card.Body className="p-4">
                  <h5 className="text-white mb-3">Tournament Standings</h5>
                  {[
                    { rank: 1, name: "Team Alpha", wins: 3, losses: 0 },
                    { rank: 2, name: "Team Gamma", wins: 2, losses: 1 },
                    { rank: 3, name: "Team Beta", wins: 1, losses: 2 },
                  ].map((team) => (
                    <div key={team.rank} className="d-flex justify-content-between align-items-center mb-2 p-2 ca-event-card">
                      <div className="d-flex align-items-center">
                        <Badge bg="secondary" className="me-3">#{team.rank}</Badge>
                        <span className="text-white">{team.name}</span>
                      </div>
                      <span className="text-secondary small">{team.wins}W - {team.losses}L</span>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="ca-section py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <Lightning size={64} className="text-primary mb-4" style={{ color: "#3b82f6" }} />
              <h2 className="display-4 fw-bold text-white mb-4">
                Ready to compete?
              </h2>
              <p className="lead ca-hero-subtitle mb-5">
                Join thousands of students organizing and competing in campus tournaments.
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Link href="/createevent">
                  <Button size="lg" className="ca-cta-primary px-5 py-3">
                    Create Tournament
                  </Button>
                </Link>
                <Link href="/publicevents">
                  <Button size="lg" variant="outline-light" className="ca-cta-secondary px-5 py-3">
                    Browse Events
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
