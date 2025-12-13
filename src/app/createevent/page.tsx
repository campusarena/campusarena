'use client';

// src/app/createevent/page.tsx
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { createTournamentAction } from '@/lib/eventActions';
import BackButton from '@/components/BackButton';

export const dynamic = 'force-dynamic';

export default function CreateEventPage() {
  return (
    <main>
      <Container className="py-5">
        <BackButton label="← Back" fallbackHref="/dashboard" />

        <Row className="justify-content-center">
          <Col md={7} lg={6}>
            <Card className="ca-auth-card">
              <Card.Body>
                <h2 className="text-center mb-4">Create New Event</h2>

                <form action={createTournamentAction}>
                  <Form.Group className="mb-3">
                    <Form.Label>Event Name</Form.Label>
                    <Form.Control
                      name="name"
                      type="text"
                      placeholder="Spring Smash Bracket"
                      required
                      className="ca-auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Game / Sport</Form.Label>
                    <Form.Control
                      name="game"
                      type="text"
                      placeholder="Super Smash Bros. Ultimate"
                      required
                      className="ca-auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Location (optional)</Form.Label>
                    <Form.Control
                      name="location"
                      type="text"
                      placeholder="UH Mānoa Campus Center"
                      className="ca-auth-input"
                    />
                  </Form.Group>

                  {/* Start date and time */}
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date and Time</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        name="startDate"
                        type="date"
                        required
                        className="ca-auth-input"
                      />
                      <Form.Control
                        name="startTime"
                        type="time"
                        required
                        className="ca-auth-input"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select
                      name="format"
                      disabled
                      className="ca-auth-input"
                    >
                      <option value="SINGLE_ELIM">
                        Single Elimination (current)
                      </option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Event Type</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="radio"
                        id="event-team"
                        label="Team based"
                        name="isTeamBased"
                        value="team"
                        defaultChecked
                      />
                      <Form.Check
                        type="radio"
                        id="event-individual"
                        label="Individual"
                        name="isTeamBased"
                        value="individual"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Max Participants (optional)</Form.Label>
                    <Form.Control
                      name="maxParticipants"
                      type="number"
                      min={2}
                      placeholder="16"
                      className="ca-auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Visibility</Form.Label>
                    <Form.Select
                      name="visibility"
                      defaultValue="PUBLIC"
                      className="ca-auth-input"
                    >
                      <option value="PUBLIC">
                        Public (anyone can view and request to join)
                      </option>
                      <option value="PRIVATE">
                        Private (only invited players)
                      </option>
                    </Form.Select>
                  </Form.Group>

                  <Button type="submit" className="ca-auth-button">
                    Create Event
                  </Button>
                </form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
