'use client';

import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Card, Col, Container, Button, Form, Row } from 'react-bootstrap';
import { createUser } from '@/lib/dbActions';

type SignUpForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const SignUp = () => {
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(30, 'Name must not exceed 30 characters'),
    email: Yup.string().required('Email is required').email('Email is invalid'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(40, 'Password must not exceed 40 characters'),
    confirmPassword: Yup.string()
      .required('Confirm Password is required')
      .oneOf([Yup.ref('password'), ''], 'Confirm Password does not match'),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    const { email, password, name } = data;

    try {
      // Create user in DB
      await createUser({ email, password, name });

      // Then sign in
      await signIn('credentials', {
        callbackUrl: '/add', // or '/dashboard' later if you want
        email,
        password,
      });
    } catch (err: unknown) {
      const message = (err as Error).message;

      if (message === 'EMAIL_TAKEN') {
        setError('email', {
          type: 'manual',
          message: 'That email is already registered.',
        });
        return;
      }

      if (message === 'NAME_TAKEN') {
        setError('name', {
          type: 'manual',
          message: 'That name is already taken. Please choose another.',
        });
        return;
      }

      console.error('Sign up failed:', err);
    }
  };

  return (
    <main className="ca-auth-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <h1 className="text-center mb-4 text-white">Sign Up</h1>

            <Card className="ca-auth-card">
              <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                  {/* Name */}
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`form-control ca-auth-input ${errors.name ? 'is-invalid' : ''}`}
                    />
                    <div className="invalid-feedback">
                      {errors.name?.message}
                    </div>
                  </Form.Group>

                  {/* Email */}
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <input
                      type="text"
                      {...register('email')}
                      className={`form-control ca-auth-input ${errors.email ? 'is-invalid' : ''}`}
                    />
                    <div className="invalid-feedback">
                      {errors.email?.message}
                    </div>
                  </Form.Group>

                  {/* Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <input
                      type="password"
                      {...register('password')}
                      className={`form-control ca-auth-input ${errors.password ? 'is-invalid' : ''}`}
                    />
                    <div className="invalid-feedback">
                      {errors.password?.message}
                    </div>
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <input
                      type="password"
                      {...register('confirmPassword')}
                      className={`form-control ca-auth-input ${
                        errors.confirmPassword ? 'is-invalid' : ''
                      }`}
                    />
                    <div className="invalid-feedback">
                      {errors.confirmPassword?.message}
                    </div>
                  </Form.Group>

                  <Form.Group className="py-2">
                    <Row className="g-2">
                      <Col>
                        <Button type="submit" className="ca-auth-button">
                          Register
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          type="button"
                          onClick={() => reset()}
                          className="w-100"
                          variant="outline-light"
                        >
                          Reset
                        </Button>
                      </Col>
                    </Row>
                  </Form.Group>
                </Form>
              </Card.Body>

              <Card.Footer className="ca-auth-footer text-center">
                Already have an account?
                <a href="/auth/signin">Sign in</a>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default SignUp;
