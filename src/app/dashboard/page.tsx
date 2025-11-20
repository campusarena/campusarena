'use client';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

export default function DashboardPage() {
  return (
    <Container id="dashboard-page" className="py-4">
      {/* Title and main button */}
      <Row className="mb-4">
        <Col className="text-center">
          <h1>Home Dashboard</h1>
          <Button variant="primary" className="mt-3">
            Create New Event
          </Button>
        </Col>
      </Row>

      {/* Main dashboard card */}
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card>
            <Card.Body>
              {/* Top row: Active Events + Upcoming Matches */}
              <Row className="mb-4">
                {/* Active Events (top left) */}
                <Col md={6} className="mb-4 mb-md-0">
                  <h2 className="h5 mb-3">Active Events</h2>

                  <Card className="mb-2">
                    <Card.Body>
                      <div className="fw-semibold">
                        Spring Basketball League
                      </div>
                      <div className="text-muted">League</div>
                    </Card.Body>
                  </Card>

                  <Card>
                    <Card.Body>
                      <div className="fw-semibold">
                        Open Smash Tournament
                      </div>
                      <div className="text-muted">Tournament</div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Upcoming Matches (top right) */}
                <Col md={6}>
                  <h2 className="h5 mb-3">Upcoming Matches</h2>

                  <div className="mb-3">
                    <div className="fw-semibold">Monday Night Soccer</div>
                    <div className="text-muted">April 29</div>
                    <div className="text-muted">Tigers vs Wildcats</div>
                  </div>

                  <div>
                    <div className="fw-semibold">
                      Collegiate Dota 2 Championship
                    </div>
                    <div className="text-muted">May 1</div>
                    <div className="text-muted">
                      Alpha Team vs Group B
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Bottom row: My Next Matches + Recent Results */}
              <Row>
                {/* My Next Matches (bottom left) */}
                <Col md={6} className="mb-4 mb-md-0">
                  <h3 className="h6 mb-3">My Next Matches</h3>

                  <div>
                    <div className="fw-semibold">Monday Night Soccer</div>
                    <div className="text-muted">April 29</div>
                  </div>
                </Col>

                {/* Recent Results (bottom right) */}
                <Col md={6}>
                  <h3 className="h6 mb-3">Recent Results</h3>

                  <div className="mb-2">
                    <div className="fw-semibold">
                      Basketball Team A vs Basketball Team D
                    </div>
                    <div className="text-muted">Player 1 vs Player 3</div>
                  </div>

                  <div>
                    <div className="fw-semibold">
                      Spring League Finals
                    </div>
                    <div className="text-muted">
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
  );
}
