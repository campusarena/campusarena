"use client";

import { Container, Row, Col, Card, Badge, Button } from "react-bootstrap";
import { useRouter } from "next/navigation";

export type LandingEvent = {
  id: number;
  name: string;
  game: string;
  date: string | null;
  status: string;
  format: string;
  isTeamBased: boolean;
  maxParticipants: number | null;
  participantCount: number;
  location: string | null;
};

export default function HomeClient({ upcomingEvents }: { upcomingEvents: LandingEvent[] }) {
  const router = useRouter();

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

              <h1 className="display-4 fw-bold mb-3 text-white">Organize. Compete. Connect.</h1>

              <p className="lead ca-hero-subtitle">
                CampusArena helps students create and join leagues and tournaments for both sports
                and esports — with brackets, standings, and match pages in one place.
              </p>

              <div className="d-flex flex-wrap gap-3 mt-4">
                <Button size="lg" className="ca-cta-primary" onClick={() => router.push("/createevent")}>
                  Create an event
                </Button>
                <Button
                  size="lg"
                  variant="outline-light"
                  className="ca-cta-secondary"
                  onClick={() => router.push("/events")}
                >
                  Browse public events
                </Button>
              </div>
            </Col>

            {/* UPCOMING EVENTS CARD */}
            <Col lg={6}>
              <div className="ca-hero-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary small">Upcoming public events</span>
                  <span className="text-secondary small">Live preview</span>
                </div>

                <div className="d-flex flex-column gap-3">
                  {upcomingEvents.length === 0 && (
                    <div className="text-secondary small">No upcoming public events</div>
                  )}

                  {upcomingEvents.map((ev) => (
                    <Card key={ev.id} className="ca-event-card">
                      <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                        <div>
                          <div className="fw-semibold text-white">{ev.name}</div>
                          <div className="text-secondary small">{ev.game}</div>
                          <div className="text-secondary small mt-1">
                            {ev.date ? new Date(ev.date).toLocaleString() : "TBD"}
                          </div>
                        </div>

                        <div className="text-end mt-3 mt-md-0">
                          <Badge className="ca-event-tag mb-1">Public</Badge>
                          <div className="text-secondary small">
                            {ev.participantCount}/{ev.maxParticipants ?? "?"} players
                          </div>
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
    </>
  );
}