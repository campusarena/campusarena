"use client";
import { Container, Row, Col, Card, Badge, Button } from "react-bootstrap";
import { Controller, Trophy, People, Film } from "react-bootstrap-icons";

export default function Home() {
  const upcomingEvents = [
    {
      title: "Team Soccer Nights",
      game: "Outdoor Soccer",
      date: "Fridays · 7:00 PM",
      spots: "12/16 teams",
      tag: "Public",
    },
    {
      title: "Smash Bros. Showdown",
      game: "Super Smash Bros. Ultimate",
      date: "Sat · 3:00 PM",
      spots: "24/32 players",
      tag: "Esports",
    },
    {
      title: "Mario Kart Sprint Cup",
      game: "Mario Kart 8 Deluxe",
      date: "Sun · 6:00 PM",
      spots: "18/24 players",
      tag: "Casual",
    },
  ];

  const features = [
    {
      icon: <Trophy />,
      title: "Tournament formats",
      text: "Run single-elimination brackets now, with room to expand to Swiss, double-elim, and round robin.",
    },
    {
      icon: <Controller />,
      title: "Sports & esports",
      text: "Support both on-field leagues and online events for games like Smash, Valorant, Mario Kart, and more.",
    },
    {
      icon: <People />,
      title: "Match pages & standings",
      text: "Each matchup gets its own page with time, teams, and score reporting, plus a standings + bracket view.",
    },
    {
      icon: <Film />,
      title: "Season highlights",
      text: "Optionally link VODs so players can rewatch key moments and share highlights with their friends.",
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="ca-hero">
        <Container className="py-5">
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="ca-hero-pill mb-3">
                Built for UH Mānoa rec leagues & esports
              </div>
              <h1 className="display-4 fw-bold mb-3 text-white">
                Organize. Compete. Connect.
              </h1>
              <p className="lead ca-hero-subtitle">
                CampusArena helps students create and join leagues and tournaments for both sports
                and esports — with brackets, standings, and match pages in one place.
              </p>
              <div className="d-flex flex-wrap gap-3 mt-4">
                <Button size="lg" className="ca-cta-primary">
                  Create an event
                </Button>
                <Button size="lg" variant="outline-light" className="ca-cta-secondary">
                  Browse public events
                </Button>
              </div>
            </Col>

            <Col lg={6}>
              <div className="ca-hero-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary small">Upcoming public events</span>
                  <span className="text-secondary small">Live preview</span>
                </div>
                <div className="d-flex flex-column gap-3">
                  {upcomingEvents.map((ev, i) => (
                    <Card key={i} className="ca-event-card">
                      <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                        <div>
                          <div className="fw-semibold text-white">{ev.title}</div>
                          <div className="text-secondary small">{ev.game}</div>
                          <div className="text-secondary small mt-1">{ev.date}</div>
                        </div>
                        <div className="text-end mt-3 mt-md-0">
                          <Badge className="ca-event-tag mb-1">{ev.tag}</Badge>
                          <div className="text-secondary small">{ev.spots}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FEATURE SECTION */}
      <section className="ca-section">
        <Container>
          <Row className="mb-4">
            <Col md={8}>
              <h2 className="fw-bold text-white mb-2">Everything you need to run a season</h2>
              <p className="ca-section-subtitle">
                CampusArena keeps players, organizers, and matches organized so you can focus on
                the games — not the spreadsheets.
              </p>
            </Col>
          </Row>
          <Row xs={1} md={2} className="g-4">
            {features.map((f, i) => (
              <Col key={i}>
                <Card className="ca-feature-card h-100">
                  <Card.Body>
                    <div className="ca-feature-icon mb-3">{f.icon}</div>
                    <h5 className="fw-semibold text-white mb-2">{f.title}</h5>
                    <p className="ca-feature-text mb-0">{f.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* FOOTER */}
      <footer className="ca-footer">
        <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <span className="text-secondary small">
            © {new Date().getFullYear()} CampusArena · UH Mānoa project
          </span>
          <div className="d-flex gap-3 small">
            <a href="/docs/overview" className="ca-footer-link">
              Overview
            </a>
            <a href="/docs/developer-guide" className="ca-footer-link">
              Developer guide
            </a>
            <a href="https://github.com/campusarena/campusarena" className="ca-footer-link">
              GitHub
            </a>
          </div>
        </Container>
      </footer>
    </>
  );
}
