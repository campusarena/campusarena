'use client';

import { useState } from 'react';
import { Form, Alert, Spinner } from 'react-bootstrap';

interface ReportScoreFormProps {
  matchId: number;
  player1Name: string;
  player2Name: string;
  p1Id: number;
  p2Id: number;
  onSuccess?: () => void;
}

export default function ReportScoreForm({
  matchId,
  player1Name,
  player2Name,
  p1Id,
  p2Id,
  onSuccess,
}: ReportScoreFormProps) {
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (p1Score === p2Score) {
      setMessage({ type: 'danger', text: 'Ties are not allowed. Please enter different scores.' });
      return;
    }

    const winnerParticipantId = p1Score > p2Score ? p1Id : p2Id;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/match/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          p1Score,
          p2Score,
          winnerParticipantId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Match result submitted! Waiting for admin verification.' 
        });
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'danger', text: data.error || 'Failed to submit match result' });
      }
    } catch (error) {
      console.error('Error submitting match report:', error);
      setMessage({ type: 'danger', text: 'An error occurred while submitting the match result' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm" style={{
      background: '#101116',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
      borderRadius: '1rem'
    }}>
      <div className="card-header" style={{
        background: 'linear-gradient(135deg, #5b8dff, #a855ff, #ff4fa3)',
        borderBottom: 'none',
        borderRadius: '1rem 1rem 0 0'
      }}>
        <h5 className="mb-0 text-white">
          <i className="bi bi-clipboard-check me-2"></i>
          Report Match Score
        </h5>
      </div>
      <div className="card-body" style={{ background: '#101116' }}>
        {message && (
          <Alert 
            variant={message.type} 
            dismissible 
            onClose={() => setMessage(null)}
            style={{
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: '#f4f4f8'
            }}
          >
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <Form.Group>
                <Form.Label className="fw-bold" style={{ color: '#f4f4f8' }}>{player1Name}</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={p1Score}
                  onChange={(e) => setP1Score(parseInt(e.target.value) || 0)}
                  disabled={loading}
                  size="lg"
                  className="text-center"
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    background: '#0a0b0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f4f4f8',
                    borderRadius: '0.5rem'
                  }}
                />
              </Form.Group>
            </div>

            <div className="col-md-2 text-center">
              <div className="fw-bold mb-3" style={{ color: '#a9acc9' }}>VS</div>
            </div>

            <div className="col-md-5">
              <Form.Group>
                <Form.Label className="fw-bold" style={{ color: '#f4f4f8' }}>{player2Name}</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={p2Score}
                  onChange={(e) => setP2Score(parseInt(e.target.value) || 0)}
                  disabled={loading}
                  size="lg"
                  className="text-center"
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    background: '#0a0b0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f4f4f8',
                    borderRadius: '0.5rem'
                  }}
                />
              </Form.Group>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #5b8dff, #a855ff, #ff4fa3)',
                border: 'none',
                borderRadius: '999px',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 0 25px rgba(104, 129, 255, 0.45)'
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Submit Match Result
                </>
              )}
            </button>
          </div>

          <div className="mt-3 text-center">
            <small style={{ color: '#a9acc9' }}>
              <i className="bi bi-info-circle me-1"></i>
              Your submission will be reviewed by an admin before being finalized
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
