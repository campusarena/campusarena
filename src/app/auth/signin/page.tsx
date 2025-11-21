'use client';

import { signIn } from 'next-auth/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

const SignIn = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };
    const email = target.email.value;
    const password = target.password.value;

    const result = await signIn('credentials', {
      callbackUrl: '/list',
      email,
      password,
    });

    if (result?.error) {
      console.error('Sign in failed:', result.error);
    }
  };

  return (
    <main className="ca-auth-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <h1 className="text-center mb-4 text-white">Sign In</h1>

            <Card className="ca-auth-card">
              <Card.Body>
                <Form method="post" onSubmit={handleSubmit}>
                  <Form.Group controlId="formBasicEmail" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <input
                      name="email"
                      type="text"
                      className="form-control ca-auth-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <input
                      name="password"
                      type="password"
                      className="form-control ca-auth-input"
                    />
                  </Form.Group>

                  <Button type="submit" className="mt-2 ca-auth-button">
                    Sign in
                  </Button>
                </Form>
              </Card.Body>

              <Card.Footer className="ca-auth-footer text-center">
                Don&apos;t have an account?
                <a href="/auth/signup">Sign up</a>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default SignIn;
