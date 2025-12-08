import { EventRole } from "@prisma/client";
import Link from "next/link";
import EventInviteForm from '@/components/EventInviteForm';
import { BracketView, type BracketMatch } from '@/components/BracketView';
import { regenerateBracketAction } from '@/lib/eventActions';
import { prisma } from '@/lib/prisma';
import { CheckInButton } from './CheckInButton';

interface EventDetailsParams {
  id: string;
}

export default async function EventDetailsPage({
  params,
}: {
  params: EventDetailsParams;
}) {
  const tournamentId = Number(params.id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        include: { user: true, team: true },
        orderBy: { seed: "asc" },
      },
      matches: {
        include: {
          p1: { include: { user: true, team: true } },
          p2: { include: { user: true, team: true } },
          winner: { include: { user: true, team: true } },
        },
        orderBy: [{ roundNumber: "asc" }, { slotIndex: "asc" }],
      },
      staff: true,
    },
  });

  if (!tournament) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <h1>Event not found</h1>
          <Link
            href="/standings"
            className="btn btn-sm btn-outline-light ca-glass-button mt-3"
          >
            ← Back to standings
          </Link>
        </div>
      </section>
    );
  }

  const participantByPlayer = new Map<
    number,
    (typeof tournament.participants)[number]
  >();

  for (const p of tournament.participants) {
    const key = p.userId ?? p.teamId ?? p.id;
    const existing = participantByPlayer.get(key);

    // Prefer the record that has a non-null seed so the UI
    // shows seeded rows where available.
    if (!existing || existing.seed == null) {
      participantByPlayer.set(key, p);
    }
  }

  const uniqueParticipants = Array.from(participantByPlayer.values());

  const upcomingMatches = Array.from(
    new Map(
      tournament.matches
        .filter((m) => m.status === "PENDING" || m.status === "SCHEDULED")
        .map((m) => [m.id, m]),
    ).values(),
  );

  const bracketMatches: BracketMatch[] = tournament.matches.map((m) => ({
    id: m.id,
    roundNumber: m.roundNumber,
    slotIndex: m.slotIndex,
    p1: {
      id: m.p1?.id ?? null,
      label:
        m.p1?.user?.name ??
        m.p1?.team?.name ??
        'TBD',
    },
    p2: {
      id: m.p2?.id ?? null,
      label:
        m.p2?.user?.name ??
        m.p2?.team?.name ??
        'TBD',
    },
  }));

  // Aggregate win/loss record per participant based on VERIFIED matches.
  const recordByParticipant = new Map<
    number,
    { wins: number; losses: number }
  >();

  for (const m of tournament.matches) {
    if (!m.winnerId) continue;

    const p1Id = m.p1Id ?? undefined;
    const p2Id = m.p2Id ?? undefined;

    if (!p1Id || !p2Id) continue;

    const winnerId = m.winnerId;
    const loserId = winnerId === p1Id ? p2Id : p1Id;

    const winnerRec = recordByParticipant.get(winnerId) ?? { wins: 0, losses: 0 };
    winnerRec.wins += 1;
    recordByParticipant.set(winnerId, winnerRec);

    const loserRec = recordByParticipant.get(loserId) ?? { wins: 0, losses: 0 };
    loserRec.losses += 1;
    recordByParticipant.set(loserId, loserRec);
  }

  // Simple organizer check for now: any OWNER or ORGANIZER.
  const hasOrganizerAccess = tournament.staff.some(
    (s) => s.role === EventRole.OWNER || s.role === EventRole.ORGANIZER,
  );

  return (
    <section className="ca-standings-page">
      <div className="container py-5">
        {/* Back to Standings */}
        <div className="mb-4">
          <Link
            href="/events"
            className="btn btn-sm btn-outline-light ca-glass-button"
          >
            ← Back to events
          </Link>
        </div>

        {/* Page header – match Standings look */}
        <div className="row mb-5 text-center">
          <div className="col">
            <h1 className="fw-bold text-white mb-2">{tournament.name}</h1>
            <p className="ca-section-subtitle">{tournament.game}</p>
          </div>
        </div>

        {/* Event Info */}
        <div className="ca-feature-card mb-4 p-4">
          <h3 className="text-white mb-3">Event Information</h3>
          <p>
            <span className="fw-bold">Location:</span> {tournament.location}
          </p>
          <p>
            <span className="fw-bold">Start Date:</span>{" "}
            {tournament.startDate.toDateString()}
          </p>
          <p>
            <span className="fw-bold">Status:</span> {tournament.status}
          </p>

          {hasOrganizerAccess && (
            <form
              action={regenerateBracketAction}
              className="mt-3 d-flex flex-wrap gap-2 align-items-center"
            >
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <button
                type="submit"
                className="btn btn-sm btn-outline-light ca-glass-button"
              >
                Regenerate Bracket
              </button>
            </form>
          )}

          {/* Check-in button is visible for any logged-in participant; the */}
          {/* server action itself validates that the user is actually */}
          {/* registered for this tournament. */}
          <CheckInButton tournamentId={tournament.id} />
        </div>

        {/* Participants – uses ca-standings-table for zebra rows */}
        <div className="ca-feature-card mb-4 p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="text-white mb-0">Participants</h3>
            <div className="d-flex align-items-center gap-2">
              <span className="text-light small">Sort by:</span>
              <select
                className="form-select form-select-sm bg-dark text-light border-secondary"
                name="participantSort"
                defaultValue="seed"
                onChange={undefined}
              >
                <option value="seed">Seed</option>
                <option value="record">Record (W-L)</option>
              </select>
            </div>
          </div>

          <div className="ca-standings-table mt-3">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th className="text-center">Seed</th>
                  <th>Player / Team</th>
                  <th className="text-center">Record</th>
                </tr>
              </thead>
              <tbody>
                {uniqueParticipants.map((p) => (
                  <tr key={p.id}>
                    <td className="text-center">{p.seed}</td>
                    <td>{p.user?.name ?? p.team?.name ?? "Unknown"}</td>
                    <td className="text-center">
                      {(() => {
                        const rec = recordByParticipant.get(p.id);
                        if (!rec) return '0-0';
                        return `${rec.wins}-${rec.losses}`;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Bracket */}
        <BracketView matches={bracketMatches} />

        {/* Upcoming Matches – also wrapped in ca-standings-table */}
        <div className="ca-feature-card mb-4 p-4">
          <h3 className="text-white mb-3">Upcoming Matches</h3>

          {upcomingMatches.length === 0 ? (
            <p className="text-light mb-0">No upcoming matches.</p>
          ) : (
            <div className="ca-standings-table mt-3">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th className="text-center">Round</th>
                    <th>Matchup</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="text-center">{match.roundNumber}</td>
                      <td>
                        {match.p1?.user?.name ??
                          match.p1?.team?.name ??
                          "TBD"}{" "}
                        vs{" "}
                        {match.p2?.user?.name ??
                          match.p2?.team?.name ??
                          "TBD"}
                      </td>
                      <td>{match.location ?? "TBD"}</td>
                      <td className="text-uppercase small">{match.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite Participants */}
        <div className="ca-feature-card mb-4 p-4">
          <h3 className="text-white mb-3">Invite Participants</h3>
          <p className="text-light small mb-3">
            Generate invite links to send to players or teams. They can accept the invite
            to join this event.
          </p>

          <EventInviteForm tournamentId={tournament.id} />
        </div>
      </div>
    </section>
  );
}