'use client';

import { Container, Row, Col, Button, Table } from 'react-bootstrap';
import './match.css';

export default function MatchPage() {
  return (
    <main style={{ flex: 1, backgroundColor: '#2c2c2c' }}>
      <Container fluid className="match-page py-5">
      <Row>
        {/* Left Side - Match Details */}
        <Col lg={6} className="mb-4">
          <div className="breadcrumb-text mb-3">
            Tournaments / Super Smash Bros.
          </div>

          <h1 className="mb-5">Match</h1>

          {/* VS Section */}
          <div className="match-vs-section mb-5">
            <div className="team-container">
              <div className="team-box">
                <h3 className="team-name">Team Alpha</h3>
                <div className="team-logo"></div>
                <div className="team-score">1</div>
              </div>

              <div className="vs-divider">VS</div>

              <div className="team-box">
                <h3 className="team-name">Team Beta</h3>
                <div className="team-logo"></div>
                <div className="team-score">1</div>
              </div>
            </div>

            <Button variant="primary" size="lg" className="report-score-btn mt-4">
              REPORT SCORE
            </Button>
          </div>

          {/* Match Details Section */}
          <div className="match-details-card mb-4">
            <h4 className="mb-3">MATCH DETAILS</h4>
            <div className="detail-row">
              <span className="detail-label">Game</span>
              <span className="detail-value">Super Smash Bros.</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">April 24, 2024, 2:00 PM</span>
            </div>
          </div>

          {/* Additional Match Details */}
          <div className="match-details-card">
            <h4 className="mb-3">MATCH DETAILS</h4>
            <div className="detail-row">
              <span className="detail-label">Match Details</span>
              <span className="detail-value">Super Smash Bros: S.</span>
            </div>
          </div>
        </Col>

        {/* Right Side - Standings */}
        <Col lg={6}>
          <h2 className="standings-title mb-4">Standings</h2>
          
          <div className="standings-table-wrapper">
            <Table responsive className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>TEAM</th>
                  <th>WINS</th>
                  <th>LOSSES</th>
                  <th>WIN %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <div className="team-cell">
                      <div className="team-icon"></div>
                      <span>Team Alpha</span>
                    </div>
                  </td>
                  <td>2</td>
                  <td>1</td>
                  <td>66,7%</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>
                    <div className="team-cell">
                      <div className="team-icon"></div>
                      <span>Team Beta</span>
                    </div>
                  </td>
                  <td>1</td>
                  <td>1</td>
                  <td>66,7%</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>
                    <div className="team-cell">
                      <div className="team-icon"></div>
                      <span>Team Gamma</span>
                    </div>
                  </td>
                  <td>0</td>
                  <td>2</td>
                  <td>0.0%</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>
                    <div className="team-cell">
                      <div className="team-icon"></div>
                      <span>Team Delta</span>
                    </div>
                  </td>
                  <td>0</td>
                  <td>2</td>
                  <td>0.0%</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </Container>
    </main>
  );
}
