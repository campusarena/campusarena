import Link from 'next/link';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { prisma } from '@/lib/prisma';

type PlayerGameRatingRow = {
  userId: number;
  gameId: number;
  rating: number;
  gamesPlayed: number;
};

type SortMode = 'elo_desc' | 'elo_asc' | 'matches_desc' | 'matches_asc';

export default async function AdminEloPage({
  searchParams,
}: {
  searchParams?: { gameId?: string; sort?: string; q?: string };
}) {
  const playerGameRatingDelegate = (prisma as unknown as {
    playerGameRating: {
      findMany: (args: {
        where?: {
          gameId?: number;
        };
        select: {
          userId: true;
          gameId: true;
          rating: true;
          gamesPlayed: true;
        };
      }) => Promise<PlayerGameRatingRow[]>;
    };
  }).playerGameRating;

  const [games, users] = await Promise.all([
    prisma.game.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: (() => {
        const qRaw = (searchParams?.q ?? '').trim();
        if (!qRaw) return undefined;
        return { name: { contains: qRaw, mode: 'insensitive' } };
      })(),
      select: { id: true, email: true, name: true },
      orderBy: [{ role: 'desc' }, { id: 'asc' }],
    }),
  ]);

  const qRaw = (searchParams?.q ?? '').trim();
  const q = qRaw.length > 0 ? qRaw : '';

  const selectedGameIdRaw = searchParams?.gameId;
  const fallbackGameId = games[0]?.id ?? null;
  const selectedGameId = selectedGameIdRaw ? Number(selectedGameIdRaw) : fallbackGameId;
  const selectedGame = selectedGameId ? games.find((g) => g.id === selectedGameId) ?? null : null;

  const sortRaw = (searchParams?.sort ?? 'elo_desc') as SortMode;
  const sort: SortMode =
    sortRaw === 'elo_desc' ||
    sortRaw === 'elo_asc' ||
    sortRaw === 'matches_desc' ||
    sortRaw === 'matches_asc'
      ? sortRaw
      : 'elo_desc';

  const ratingsForGame =
    selectedGameId && selectedGame
      ? await playerGameRatingDelegate.findMany({
          where: { gameId: selectedGameId },
          select: {
            userId: true,
            gameId: true,
            rating: true,
            gamesPlayed: true,
          },
        })
      : [];

  const ratingByUserId = new Map<number, { rating: number; gamesPlayed: number }>();
  for (const r of ratingsForGame) {
    ratingByUserId.set(r.userId, { rating: r.rating, gamesPlayed: r.gamesPlayed });
  }

  const rows = users.map((u) => {
    const r = ratingByUserId.get(u.id);
    return {
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      rating: r?.rating ?? 1500,
      gamesPlayed: r?.gamesPlayed ?? 0,
    };
  });

  rows.sort((a, b) => {
    if (sort === 'elo_desc') {
      return b.rating - a.rating || b.gamesPlayed - a.gamesPlayed || a.userName.localeCompare(b.userName);
    }
    if (sort === 'elo_asc') {
      return a.rating - b.rating || b.gamesPlayed - a.gamesPlayed || a.userName.localeCompare(b.userName);
    }
    if (sort === 'matches_desc') {
      return b.gamesPlayed - a.gamesPlayed || b.rating - a.rating || a.userName.localeCompare(b.userName);
    }
    return a.gamesPlayed - b.gamesPlayed || b.rating - a.rating || a.userName.localeCompare(b.userName);
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">Admin · Elo Ratings</h1>
        <div className="d-flex gap-2 flex-wrap">
          <Link href="/admin" className="btn btn-outline-light btn-sm">
            Admin Dashboard
          </Link>
          <Link href="/admin/users" className="btn btn-outline-light btn-sm">
            Manage Users
          </Link>
        </div>
      </div>

      <Card className="ca-feature-card p-3">
        {games.length === 0 ? (
          <div className="text-muted">No supported games found.</div>
        ) : users.length === 0 ? (
          <div className="text-muted">No users found.</div>
        ) : !selectedGameId || !selectedGame ? (
          <div className="text-muted">Select a supported game to view Elo ratings.</div>
        ) : (
          <>
            <form method="get" className="d-flex gap-2 flex-wrap align-items-end mb-3">
              <div className="flex-grow-1" style={{ minWidth: 240 }}>
                <label className="text-white form-label">Search users</label>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name"
                  className="form-control ca-auth-input"
                />
              </div>

              <div>
                <label className="text-white form-label">Game</label>
                <select name="gameId" defaultValue={String(selectedGameId)} className="form-select ca-auth-input">
                  {games.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white form-label">Sort</label>
                <select name="sort" defaultValue={sort} className="form-select ca-auth-input">
                  <option value="matches_desc">Matches completed (high → low)</option>
                  <option value="matches_asc">Matches completed (low → high)</option>
                  <option value="elo_desc">Elo (high → low)</option>
                  <option value="elo_asc">Elo (low → high)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-outline-light btn-sm ca-glass-button">
                Apply
              </button>

              {q && (
                <Link
                  href={`/admin/elo?gameId=${encodeURIComponent(String(selectedGameId ?? ''))}&sort=${encodeURIComponent(
                    sort,
                  )}`}
                  className="btn btn-outline-light btn-sm"
                >
                  Clear
                </Link>
              )}
            </form>

            <Table responsive hover variant="dark" className="m-0">
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ border: 'none', padding: '0.75rem' }}>User</th>
                  <th style={{ border: 'none', padding: '0.75rem' }}>Elo</th>
                  <th style={{ border: 'none', padding: '0.75rem' }}>Matches Completed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={`${r.userId}-${selectedGameId}`}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    <td style={{ border: 'none', padding: '0.75rem' }}>
                      <div className="fw-semibold">{r.userName}</div>
                      <div className="text-muted small">{r.userEmail}</div>
                    </td>
                    <td style={{ border: 'none', padding: '0.75rem' }}>{r.rating}</td>
                    <td style={{ border: 'none', padding: '0.75rem' }}>{r.gamesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card>
    </>
  );
}
