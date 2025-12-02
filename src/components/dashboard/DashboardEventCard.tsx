// src/components/dashboard/DashboardEventCard.tsx
'use client';

import Card from 'react-bootstrap/Card';

type DashboardEventCardProps = {
  title: string;
  subtitle: string;
};

export default function DashboardEventCard({
  title,
  subtitle,
}: DashboardEventCardProps) {
  return (
    <Card className="ca-event-card mb-2">
      <Card.Body>
        <div className="fw-semibold text-white">{title}</div>
        <div className="text-secondary small">{subtitle}</div>
      </Card.Body>
    </Card>
  );
}
