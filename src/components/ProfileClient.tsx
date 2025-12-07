// src/components/ProfileClient.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { updateProfile } from '@/lib/dbActions';

type ProfileClientProps = {
  initialEmail: string;
  initialName: string;
};

type ProfileForm = {
  name: string;
  email: string;
};

const ProfileClient = ({ initialEmail, initialName }: ProfileClientProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(30, 'Name must not exceed 30 characters'),
    email: Yup.string().required('Email is required').email('Email is invalid'),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setServerError(null);
    setServerSuccess(null);

    try {
      await updateProfile({
        currentEmail: initialEmail,
        newEmail: data.email,
        name: data.name,
      });

      setServerSuccess('Profile updated successfully. You may need to sign in again if you changed your email.');
    } catch (err: unknown) {
      const message = (err as Error).message;

      if (message === 'EMAIL_TAKEN') {
        setError('email', {
          type: 'manual',
          message: 'That email is already in use.',
        });
        return;
      }

      if (message === 'NAME_TAKEN') {
        setError('name', {
          type: 'manual',
          message: 'That name is already taken.',
        });
        return;
      }

      setServerError('Failed to update profile. Please try again.');
      console.error('Update profile failed:', err);
    }
  };

  return (
    <main className="ca-auth-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={5}>
            <h1 className="text-center mb-4 text-white">Your Profile</h1>

            <Card className="ca-auth-card">
              <Card.Body>
                {serverError && (
                  <Alert variant="danger" className="mb-3">
                    {serverError}
                  </Alert>
                )}
                {serverSuccess && (
                  <Alert variant="success" className="mb-3">
                    {serverSuccess}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)}>
                  {/* Name */}
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`form-control ca-auth-input ${errors.name ? 'is-invalid' : ''}`}
                    />
                    <div className="invalid-feedback">{errors.name?.message}</div>
                  </Form.Group>

                  {/* Email */}
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <input
                      type="text"
                      {...register('email')}
                      className={`form-control ca-auth-input ${errors.email ? 'is-invalid' : ''}`}
                    />
                    <div className="invalid-feedback">{errors.email?.message}</div>
                  </Form.Group>

                  <div className="d-flex justify-content-end pt-2">
                    <Button
                      type="submit"
                      className="ca-auth-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default ProfileClient;
