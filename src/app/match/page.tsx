'use client';

import { Container, Row, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import MyMatchesList from '@/components/MyMatchesList';
import './match.css';

export default function MatchPage() {
  useSession();

  return (
    <main style={{ flex: 1, backgroundColor: '#2c2c2c' }}>
      <Container fluid className="match-page py-5">
        
        {/* My Matches Section */}
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">
                <i className="bi bi-controller me-2"></i>
                My Matches
              </h2>
            </div>
            <MyMatchesList />
          </Col>
        </Row>

      </Container>
    </main>
  );
}
