// src/components/events/PublicEventsClient.tsx
'use client';

import { useMemo, useState } from 'react';
import { Row, Col, Card, Badge, Form } from 'react-bootstrap';
import Link from 'next/link';

export type PublicEventCardData = {
  id: number;
  name: string;
  game: string;
  date: string | null;          // ISO string or null
  status: string;
  format: string;               // e.g. "SINGLE_ELIM"
  isTeamBased: boolean;
  maxParticipants: number | null;
  participantCount: number;     // current participants
  location: string | null;
};

type SortBy = 'date' | 'capacity';

type Props = {
  events: PublicEventCardData[];
};

export default function PublicEventsClient({ events }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const sortedEvents = useMemo(() => {
    const copy = [...events];

    if (sortBy === 'date') {
      copy.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
        const db = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
        return da - db; // soonest first
      });
    } else {
      // sort by percentage filled (desc)
      copy.sort((a, b) => {
        const ua =
          a.maxParticipants && a.maxParticipants > 0
            ? a.participantCount / a.maxParticipants
            : 0;
        const ub =
          b.maxParticipants && b.maxParticipants > 0
            ? b.participantCount / b.maxParticipants
            : 0;
        return ub - ua;
      });
    }

    return copy;
  }, [events, sortBy]);

  if (events.length === 0) {
    return <div className="text-secondary mt-4">No public events available yet.</div>;
  }

  return (
    <>
      {/* Sort controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="ca-section-subtitle">
          {events.length} public {events.length === 1 ? 'event' : 'events'} found
        </span>
        <Form.Select
          size="sm"
          style={{ maxWidth: '230px' }}
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value === 'capacity' ? 'capacity' : 'date')
          }
        >
          <option value="date">Sort by date (soonest first)</option>
          <option value="capacity">Sort by capacity filled</option>
        </Form.Select>
      </div>

      {/* Event cards */}
      <Row className="g-3">
        {sortedEvents.map((ev) => {
          const dateLabel = ev.date
            ? new Date(ev.date).toLocaleString()
            : 'Date TBD';

          const capacityLabel =
            ev.maxParticipants != null
              ? `${ev.participantCount} / ${ev.maxParticipants}`
              : `${ev.participantCount} players`;

          const isFull =
            ev.maxParticipants != null && ev.participantCount >= ev.maxParticipants;

          return (
            <Col key={ev.id} md={6} lg={4}>
                <Card className="ca-event-card h-100 text-white">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="text-white mb-0">
                                {ev.name}
                            </Card.Title>
                            <Badge bg="secondary" className="ca-event-tag text-uppercase">
                                {ev.format === 'SINGLE_ELIM' ? 'Single Elim' : ev.format}
                            </Badge>
                        </div>

                        <div className="text-light small mb-1">
                            {ev.game} · {ev.isTeamBased ? 'Teams' : 'Solo'}
                           </div>

                        <div className="text-light small mb-1">
                            {dateLabel}
                            {ev.location ? ` · ${ev.location}` : ''}
                        </div>

                        <div className="text-light small mb-3">
                            Capacity: {capacityLabel}
                            {isFull && <span> · Full</span>}
                        </div>

                        <Link href={`/events/${ev.id}`} className="text-decoration-none">
                            <button className="btn btn-primary btn-sm w-100">
                                View Details
                            </button>
                        </Link>
                    </Card.Body>
                </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );
}
