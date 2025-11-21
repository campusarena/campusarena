'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import swal from 'sweetalert';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { redirect } from 'next/navigation';
import { CreateEventSchema } from '@/lib/validationSchemas';

const CreateEventForm: React.FC = () => {
  const { data: session, status } = useSession();
  const currentUser = session?.user?.email || '';
  const [isPublic, setIsPublic] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(CreateEventSchema),
  });

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  const onSubmit = async (data: {
    name: string;
    description: string;
    type: string;
    format: string;
    startDate: string;
    endDate?: string;
    numberOfPlayers: number;
  }) => {
    const eventData = {
      ...data,
      isPublic,
      owner: currentUser,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    };

    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (response.ok) {
      await swal('Success', 'Event created successfully', 'success', {
        timer: 2000,
      });
    } else {
      await swal('Error', 'Failed to create event', 'error');
    }
  };

  return (
    <Container className="create-event-container">
      <div className="create-event-form-wrapper">
        <h2 className="form-title">Create Event</h2>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Event name</Form.Label>
            <input
              type="text"
              {...register('name')}
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.name?.message}</div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Event description</Form.Label>
            <textarea
              rows={4}
              {...register('description')}
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.description?.message}</div>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <select {...register('type')} className={`form-control ${errors.type ? 'is-invalid' : ''}`}>
                  <option value="TOURNAMENT">Tournament</option>
                  <option value="LEAGUE">League</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="PRACTICE">Practice</option>
                </select>
                <div className="invalid-feedback">{errors.type?.message}</div>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Format</Form.Label>
                <select {...register('format')} className={`form-control ${errors.format ? 'is-invalid' : ''}`}>
                  <option value="ROUND_ROBIN">Round Robin</option>
                  <option value="SINGLE_ELIMINATION">Single Elimination</option>
                  <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                  <option value="SWISS">Swiss</option>
                  <option value="FREE_FOR_ALL">Free For All</option>
                </select>
                <div className="invalid-feedback">{errors.format?.message}</div>
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
                  {...register('startDate')}
                  className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                />
                <div className="invalid-feedback">{errors.startDate?.message}</div>
              </Col>
              <Col md={6}>
                <input
                  type="date"
                  placeholder="End date"
                  {...register('endDate')}
                  className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                />
                <div className="invalid-feedback">{errors.endDate?.message}</div>
              </Col>
            </Row>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Number of players or teams</Form.Label>
            <input
              type="number"
              {...register('numberOfPlayers')}
              className={`form-control ${errors.numberOfPlayers ? 'is-invalid' : ''}`}
            />
            <div className="invalid-feedback">{errors.numberOfPlayers?.message}</div>
          </Form.Group>

          <input type="hidden" {...register('owner')} value={currentUser} />

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

          <Button type="submit" className="create-button w-100">
            Create
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default CreateEventForm;
