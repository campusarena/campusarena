'use client';

import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const CreateEventForm: React.FC = () => {
  const [isPublic, setIsPublic] = useState(false);

  return (
    <Container className="create-event-container">
      <div className="create-event-form-wrapper">
        <h2 className="form-title">Create Event</h2>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Event name</Form.Label>
            <input
              type="text"
              className="form-control"
              placeholder=""
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Event description</Form.Label>
            <textarea
              rows={4}
              className="form-control"
              placeholder=""
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <select className="form-control">
                  <option value="TOURNAMENT">Tournament</option>
                  <option value="LEAGUE">League</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="PRACTICE">Practice</option>
                </select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Format</Form.Label>
                <select className="form-control">
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="SINGLE_ELIMINATION">Single Elimination</option>
                  <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                  <option value="SWISS">Swiss</option>
                  <option value="FREE_FOR_ALL">Free For All</option>
                </select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Start date</Form.Label>
            <Row>
              <Col md={6}>
                <input
                  type="date"
                  placeholder="Start date"
                  className="form-control"
                />
              </Col>
              <Col md={6}>
                <input
                  type="date"
                  placeholder="End date"
                  className="form-control"
                />
              </Col>
            </Row>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Number of players or teams</Form.Label>
            <input
              type="number"
              className="form-control"
              placeholder=""
            />
          </Form.Group>

          <Form.Group className="mb-4 d-flex justify-content-between align-items-center">
            <Form.Label className="mb-0">Public</Form.Label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="publicToggle"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label htmlFor="publicToggle" className="toggle-label">
                <span className="toggle-button" />
              </label>
            </div>
          </Form.Group>

          <Button type="button" className="create-button w-100">
            Create
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default CreateEventForm;
