'use client';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Link from 'next/link';

import DashboardSection from '@/components/dashboard/DashboardSection';
import DashboardEventCard from '@/components/dashboard/DashboardEventCard';
import {
  activeEvents,
  upcomingMatches,
  myNextMatches,
  recentResults,
} from '@/data/dashboardData';

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
            <Link href="/event">
              <Button size="lg" className="ca-cta-primary mt-3">
                Create New Event
              </Button>
            </Link>
          </Col>
        </Row>

        {/* Main dashboard card */}
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="ca-hero-card">
              <Card.Body>
                {/* Top row: Active Events + Upcoming Matches */}
                <Row className="mb-4">
                  {/* Active Events */}
                  <Col md={6} className="mb-4 mb-md-0">
                    <DashboardSection title="Active Events">
                      {activeEvents.map((event) => (
                        <DashboardEventCard
                          key={event.id}
                          title={event.name}
                          subtitle={event.type}
                        />
                      ))}
                    </DashboardSection>
                  </Col>

                  {/* Upcoming Matches */}
                  <Col md={6}>
                    <DashboardSection title="Upcoming Matches">
                      {upcomingMatches.map((match) => (
                        <div key={match.id} className="mb-3">
                          <div className="fw-semibold text-white">
                            {match.title}
                          </div>
                          <div className="text-secondary small">
                            {match.date}
                          </div>
                          <div className="text-secondary small">
                            {match.extra}
                          </div>
                        </div>
                      ))}
                    </DashboardSection>
                  </Col>
                </Row>

                {/* Bottom row: My Next Matches + Recent Results */}
                <Row>
                  {/* My Next Matches */}
                  <Col md={6} className="mb-4 mb-md-0">
                    <DashboardSection title="My Next Matches" size="sm">
                      {myNextMatches.map((item) => (
                        <div key={item.id}>
                          <div className="fw-semibold text-white">
                            {item.title}
                          </div>
                          <div className="text-secondary small">
                            {item.extra}
                          </div>
                        </div>
                      ))}
                    </DashboardSection>
                  </Col>

                  {/* Recent Results */}
                  <Col md={6}>
                    <DashboardSection title="Recent Results" size="sm">
                      {recentResults.map((item) => (
                        <div key={item.id} className="mb-2">
                          <div className="fw-semibold text-white">
                            {item.title}
                          </div>
                          <div className="text-secondary small">
                            {item.extra}
                          </div>
                        </div>
                      ))}
                    </DashboardSection>
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
