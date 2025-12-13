'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Match {
  id: number;
  status: string;
  roundNumber: number | null;
  tournament: {
    name: string;
  };
  p1: {
    team?: { name: string } | null;
    user?: { email: string } | null;
  } | null;
  p2: {
    team?: { name: string } | null;
    user?: { email: string } | null;
  } | null;
  winner: {
    team?: { name: string } | null;
    user?: { email: string } | null;
  } | null;
}

export default function MyMatchesList() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchMatches();
    }
  }, [session]);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches/my-matches');
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PENDING: 'warning',
      READY: 'info',
      IN_PROGRESS: 'primary',
      COMPLETE: 'success',
      SCHEDULED: 'secondary',
      VERIFIED: 'success',
      CANCELED: 'danger',
    };
    return variants[status] || 'secondary';
  };

  if (!session) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        Please sign in to view your matches
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="card text-center py-4">
        <div className="card-body">
          <i className="bi bi-inbox" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
          <h5 className="mt-3 mb-2">No Matches Found</h5>
          <p className="text-muted mb-0">
            You don&apos;t have any scheduled matches yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-3">
      {matches.map((match) => {
        const player1Name = match.p1?.team?.name || match.p1?.user?.email || 'TBD';
        const player2Name = match.p2?.team?.name || match.p2?.user?.email || 'TBD';
        
        return (
          <div key={match.id} className="col-md-6 col-lg-4">
            <div className="card h-100" style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.02) inset',
              borderRadius: '1rem'
            }}>
              <div className="card-header" style={{
                background: '#0a0b0f',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-truncate" style={{ color: '#d5d7e5' }}>
                    {match.tournament.name}
                  </small>
                  <span className={`badge bg-${getStatusBadge(match.status)}`}>
                    {match.status}
                  </span>
                </div>
              </div>
              <div className="card-body" style={{ background: '#101116' }}>
                <div className="text-center mb-3">
                  <div className="mb-2">
                    <strong className="text-truncate d-block" style={{ color: '#f4f4f8' }}>{player1Name}</strong>
                  </div>
                  <div className="small mb-2" style={{ color: '#a9acc9' }}>VS</div>
                  <div>
                    <strong className="text-truncate d-block" style={{ color: '#f4f4f8' }}>{player2Name}</strong>
                  </div>
                </div>

                {match.status === 'COMPLETE' && match.winner && (
                  <div className="text-center mt-2 p-2 rounded" style={{
                    background: 'rgba(34, 197, 94, 0.15)'
                  }}>
                    <small style={{ color: '#f4f4f8' }}>
                      <i className="bi bi-trophy-fill text-warning me-1"></i>
                      Winner: {match.winner.team?.name || match.winner.user?.email}
                    </small>
                  </div>
                )}

                {match.roundNumber && (
                  <div className="text-center mt-2">
                    <small style={{ color: '#a9acc9' }}>Round {match.roundNumber}</small>
                  </div>
                )}
              </div>
              <div className="card-footer" style={{
                background: '#0a0b0f',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <Link 
                  href={`/match/${match.id}`} 
                  className="btn btn-sm w-100"
                  style={{
                    borderRadius: '999px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #5b8dff, #a855ff, #ff4fa3)',
                    boxShadow: '0 0 20px rgba(104, 129, 255, 0.45)',
                    color: '#ffffff',
                    fontWeight: '600',
                    padding: '0.5rem 1rem'
                  }}
                >
                  <>
                    <i className="bi bi-eye me-2"></i>
                    View Match
                  </>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
