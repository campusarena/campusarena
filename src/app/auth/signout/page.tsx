'use client';

import { signOut } from 'next-auth/react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

const SignOut = () => {
  return (
    <main className="ca-auth-page">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <h1 className="text-center mb-4 text-white">Sign Out</h1>

            <Card className="ca-auth-card text-center">
              <Card.Body>
                <h5 className="mb-4">Are you sure you want to sign out?</h5>

                <div className="d-flex flex-column gap-3">
                  <Button
                    className="ca-auth-button"
                    onClick={() =>
                      signOut({
                        callbackUrl: '/',
                        redirect: true,
                      })
                    }
                  >
                    Sign Out
                  </Button>

                  <Button
                    variant="outline-light"
                    href="/"
                    className="w-100"
                    style={{ borderRadius: '999px' }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default SignOut;
