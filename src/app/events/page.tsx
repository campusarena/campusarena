'use client';

import Container from 'react-bootstrap/Container';

export default function EventsPage() {
  return (
    <section className="ca-section">
      <Container>
        <h1 className="fw-bold text-white mb-3">Browse Events</h1>
        <p className="ca-section-subtitle">
          View public tournaments, leagues, and upcoming competitions.
        </p>

        {/* TODO: Replace with real event cards when Prisma data is ready */}
        <div className="text-secondary mt-4">
          No events available yet.
        </div>
      </Container>
    </section>
  );
}
