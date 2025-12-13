'use client';

import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { createTournamentAction } from '@/lib/eventActions';
import BackButton from '@/components/BackButton';

type SupportedGame = { id: number; name: string };

export default function CreateEventClient({
  supportedGames,
}: {
  supportedGames: SupportedGame[];
}) {
  const [seedBySkill, setSeedBySkill] = useState(false);
  const [customGame, setCustomGame] = useState('');
  const [supportedGameId, setSupportedGameId] = useState<string>('');

  const hasSupportedGames = supportedGames.length > 0;

  const defaultSupportedGameId = useMemo(() => {
    if (!hasSupportedGames) return '';
    return String(supportedGames[0].id);
  }, [hasSupportedGames, supportedGames]);

  useEffect(() => {
    if (seedBySkill) {
      setCustomGame('');
      setSupportedGameId((prev) => prev || defaultSupportedGameId);
    } else {
      setSupportedGameId('');
    }
  }, [seedBySkill, defaultSupportedGameId]);

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
                    <Form.Check
                      type="switch"
                      id="seed-by-skill"
                      name="seedBySkill"
                      label="Seed by player skill (supported games only)"
                      checked={seedBySkill}
                      onChange={(e) => setSeedBySkill(e.target.checked)}
                    />
                  </Form.Group>

                  {seedBySkill ? (
                    <Form.Group className="mb-3">
                      <Form.Label>Supported Game</Form.Label>
                      <Form.Select
                        name="supportedGameId"
                        className="ca-auth-input"
                        required
                        disabled={!hasSupportedGames}
                        value={supportedGameId}
                        onChange={(e) => setSupportedGameId(e.target.value)}
                      >
                        {hasSupportedGames ? (
                          supportedGames.map((g) => (
                            <option key={g.id} value={String(g.id)}>
                              {g.name}
                            </option>
                          ))
                        ) : (
                          <option value="">No supported games available</option>
                        )}
                      </Form.Select>
                    </Form.Group>
                  ) : (
                    <Form.Group className="mb-3">
                      <Form.Label>Game / Sport</Form.Label>
                      <Form.Control
                        name="game"
                        type="text"
                        placeholder="Super Smash Bros. Ultimate"
                        required
                        className="ca-auth-input"
                        value={customGame}
                        onChange={(e) => setCustomGame(e.target.value)}
                      />
                    </Form.Group>
                  )}

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
                    <Form.Label>Location (optional)</Form.Label>
                    <Form.Control
                      name="location"
                      type="text"
                      placeholder="UH Mānoa Campus Center"
                      className="ca-auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select name="format" disabled className="ca-auth-input">
                      <option value="SINGLE_ELIM">Single Elimination (current)</option>
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
                      <option value="PUBLIC">Public (anyone can view and request to join)</option>
                      <option value="PRIVATE">Private (only invited players)</option>
                    </Form.Select>
                  </Form.Group>

                  <Button type="submit" className="ca-auth-button" disabled={seedBySkill && !hasSupportedGames}>
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
