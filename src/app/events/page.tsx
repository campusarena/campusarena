import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { loggedInProtectedPage } from '@/lib/page-protection';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { Calendar, People, Trophy, Clock } from 'react-bootstrap-icons';

const Events = async () => {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );

  // Mock event data for visual mockup
  const mockEvents = [
    {
      id: 1,
      name: 'Fall Basketball Tournament',
      description: 'Annual basketball tournament open to all skill levels. Teams of 5 players compete in a single elimination format.',
      type: 'Tournament',
      format: 'Single Elimination',
      startDate: 'Dec 15, 2025',
      endDate: 'Dec 18, 2025',
      numberOfPlayers: 32,
      isPublic: true,
      status: 'Upcoming',
    },
    {
      id: 2,
      name: 'Soccer League - Winter Season',
      description: 'Competitive soccer league running throughout the winter. Round robin format with playoffs.',
      type: 'League',
      format: 'Round Robin',
      startDate: 'Jan 10, 2026',
      endDate: 'Mar 25, 2026',
      numberOfPlayers: 64,
      isPublic: true,
      status: 'Registration Open',
    },
    {
      id: 3,
      name: 'Pickup Volleyball',
      description: 'Casual volleyball games every Friday evening. Drop in anytime, no registration required.',
      type: 'Pickup',
      format: 'Free For All',
      startDate: 'Nov 22, 2025',
      endDate: null,
      numberOfPlayers: 12,
      isPublic: true,
      status: 'Active',
    },
    {
      id: 4,
      name: 'Tennis Practice Sessions',
      description: 'Weekly tennis practice for intermediate players. Improve your skills with guided drills and match play.',
      type: 'Practice',
      format: 'Round Robin',
      startDate: 'Nov 25, 2025',
      endDate: 'Dec 20, 2025',
      numberOfPlayers: 16,
      isPublic: false,
      status: 'Registration Open',
    },
    {
      id: 5,
      name: 'Ultimate Frisbee Championship',
      description: 'Regional ultimate frisbee championship with teams from multiple universities.',
      type: 'Tournament',
      format: 'Swiss',
      startDate: 'Feb 5, 2026',
      endDate: 'Feb 7, 2026',
      numberOfPlayers: 48,
      isPublic: true,
      status: 'Upcoming',
    },
    {
      id: 6,
      name: 'Badminton Doubles League',
      description: 'Doubles badminton league with weekly matches. All skill levels welcome.',
      type: 'League',
      format: 'Double Elimination',
      startDate: 'Dec 1, 2025',
      endDate: 'Jan 31, 2026',
      numberOfPlayers: 24,
      isPublic: true,
      status: 'Active',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      Active: 'success',
      Upcoming: 'info',
      'Registration Open': 'warning',
      Completed: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Tournament') return <Trophy className="me-1" />;
    if (type === 'League') return <Trophy className="me-1" />;
    return <People className="me-1" />;
  };
  
  return (
    <main>
      <Container className="events-page py-4">
        <div className="events-header mb-4">
          <h1 className="events-title">Campus Events</h1>
          <p className="events-subtitle">Join tournaments, leagues, and pickup games</p>
        </div>

        <div className="events-filters mb-4">
          <Button variant="outline-primary" className="me-2">All Events</Button>
          <Button variant="outline-secondary" className="me-2">Tournaments</Button>
          <Button variant="outline-secondary" className="me-2">Leagues</Button>
          <Button variant="outline-secondary" className="me-2">Pickup Games</Button>
          <Button variant="outline-secondary">Practice</Button>
        </div>

        <Row>
          {mockEvents.map((event) => (
            <Col key={event.id} md={6} lg={4} className="mb-4">
              <Card className="event-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="event-card-title">{event.name}</Card.Title>
                    {getStatusBadge(event.status)}
                  </div>
                  
                  <Card.Text className="event-description text-muted">
                    {event.description}
                  </Card.Text>

                  <div className="event-details">
                    <div className="event-detail-item mb-2">
                      {getTypeIcon(event.type)}
                      <span className="fw-semibold">{event.type}</span>
                      <span className="text-muted ms-2">• {event.format}</span>
                    </div>

                    <div className="event-detail-item mb-2">
                      <Calendar className="me-1" />
                      <span>{event.startDate}</span>
                      {event.endDate && <span> - {event.endDate}</span>}
                    </div>

                    <div className="event-detail-item mb-3">
                      <People className="me-1" />
                      <span>{event.numberOfPlayers} players</span>
                      {event.isPublic && (
                        <Badge bg="light" text="dark" className="ms-2">Public</Badge>
                      )}
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <Button variant="primary" className="event-join-btn">
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-4">
          <p className="text-muted">
            <em>This is a visual mockup. Functionality coming soon!</em>
          </p>
        </div>
      </Container>
    </main>
  );
};

export default Events;
