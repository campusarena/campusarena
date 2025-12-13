import { EventRole, Role } from "@prisma/client";
import Link from "next/link";
import EventInviteForm from '@/components/EventInviteForm';
import { BracketView, type BracketMatch } from '@/components/BracketView';
import { regenerateBracketAction, updateTournamentStatusAction } from '@/lib/eventActions';
import { prisma } from '@/lib/prisma';
import ParticipantsTable from './ParticipantsTable';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import BackButton from "@/components/BackButton";
import { CheckInButton } from './CheckInButton';
import EditMatchScoreClient, { type EditableMatchSummary } from './EditMatchScoreClient';
import TeamsCardClient from './TeamsCardClient';

interface EventDetailsParams {
  id: string;
}

export default async function EventDetailsPage({
  params,
}: {
  params: EventDetailsParams;
}) {
  const session = await getServerSession(authOptions);
  const typedUser = session?.user as { id?: string | number } | undefined;
  const currentUserId = typedUser?.id ? Number(typedUser.id) : null;

  const tournamentId = Number(params.id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        include: { user: true, team: true },
        orderBy: { seed: "asc" },
      },
      teams: {
        orderBy: { createdAt: 'asc' },
        include: {
          members: {
            orderBy: { isCaptain: 'desc' },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
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
          <BackButton
            label="← Back"
            fallbackHref="/publicevents"
          />
        </div>
      </section>
    );
  }

  // Show date and time nicely formatted
  const formattedStart = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(tournament.startDate);

  const playerKeyForParticipant = (p: { id: number }) => p.id;

  // Use the tournament participants list as the authoritative set for
  // standings, keyed solely by participant id.
  const uniqueParticipants = [...tournament.participants];

  const upcomingMatches = Array.from(
    new Map(
      tournament.matches
        .filter((m) => m.status === "PENDING" || m.status === "SCHEDULED")
        .map((m) => [m.id, m]),
    ).values(),
  );

  // Check if any matches have been completed to lock regenerate bracket
  const hasCompletedMatches = tournament.matches.some(
    (m) => m.status === "COMPLETE" || m.status === "VERIFIED" || m.completedAt !== null
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
        "TBD",
    },
    p2: {
      id: m.p2?.id ?? null,
      label:
        m.p2?.user?.name ??
        m.p2?.team?.name ??
        "TBD",
    },
  }));

  // Aggregate win/loss record per participant based on VERIFIED matches.
  const recordByPlayer = new Map<number, { wins: number; losses: number }>();

  for (const m of tournament.matches) {
    if (m.status !== "VERIFIED" || !m.winnerId || !m.p1Id || !m.p2Id) continue;

    const p1Key = m.p1Id;
    const p2Key = m.p2Id;

    const winnerKey = m.winnerId === m.p1Id ? p1Key : p2Key;
    const loserKey = winnerKey === p1Key ? p2Key : p1Key;

    const winnerRec = recordByPlayer.get(winnerKey) ?? { wins: 0, losses: 0 };
    winnerRec.wins += 1;
    recordByPlayer.set(winnerKey, winnerRec);

    const loserRec = recordByPlayer.get(loserKey) ?? { wins: 0, losses: 0 };
    loserRec.losses += 1;
    recordByPlayer.set(loserKey, loserRec);
  }

  const participantRecordsForClient = uniqueParticipants.map((p) => {
    const key = playerKeyForParticipant(p);
    const rec = recordByPlayer.get(key) ?? { wins: 0, losses: 0 };
    return {
      participantId: p.id,
      seed: p.seed,
      name: p.user?.name ?? p.team?.name ?? "Unknown",
      key,
      wins: rec.wins,
      losses: rec.losses,
    };
  });

  // Simple organizer check for now: any OWNER or ORGANIZER for this user.
  const hasOrganizerAccess = !!(
    currentUserId &&
    tournament.staff.some(
      (s) =>
        s.userId === currentUserId &&
        (s.role === EventRole.OWNER || s.role === EventRole.ORGANIZER),
    )
  );

  const currentUser = currentUserId
    ? await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true } })
    : null;
  const isAdmin = currentUser?.role === Role.ADMIN;
  const canManageEventStatus = hasOrganizerAccess || isAdmin;

  const canEditMatchScores = hasOrganizerAccess && !isAdmin;

  const editableMatches: EditableMatchSummary[] = tournament.matches
    .filter((m) => m.p1Id && m.p2Id)
    .map((m) => ({
      id: m.id,
      roundNumber: m.roundNumber ?? null,
      slotIndex: m.slotIndex ?? null,
      p1Label: m.p1?.user?.name ?? m.p1?.team?.name ?? 'TBD',
      p2Label: m.p2?.user?.name ?? m.p2?.team?.name ?? 'TBD',
    }));

  // Determine if the current user is a participant (individual or team-member) and whether they are checked in.
  let isParticipant = false;
  let isCheckedIn = false;

  if (currentUserId) {
    if (tournament.isTeamBased) {
      const teamParticipant = await prisma.participant.findFirst({
        where: {
          tournamentId: tournament.id,
          team: {
            members: {
              some: { userId: currentUserId },
            },
          },
        },
        select: { checkedIn: true },
      });
      isParticipant = !!teamParticipant;
      isCheckedIn = !!teamParticipant?.checkedIn;
    } else {
      const currentUserParticipant = tournament.participants.find((p) => p.userId === currentUserId);
      isParticipant = !!currentUserParticipant;
      isCheckedIn = !!currentUserParticipant?.checkedIn;
    }
  }

  return (
    <section className="ca-standings-page">
      <div className="container py-5">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton
            label="← Back"
            fallbackHref="/events"
          />
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
            {formattedStart}
          </p>
          <p>
            <span className="fw-bold">Status:</span> {tournament.status}
          </p>
          <p>
            <span className="fw-bold">Event Type:</span> {tournament.isTeamBased ? 'Team' : 'Solo'}
          </p>

          {canManageEventStatus && (
            <form
              action={updateTournamentStatusAction}
              className="d-flex flex-wrap gap-2 align-items-center"
            >
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <select
                name="status"
                defaultValue={tournament.status}
                className="form-select form-select-sm w-auto"
                aria-label="Set event status"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Complete</option>
              </select>
              <button
                type="submit"
                className="btn btn-sm btn-outline-light ca-glass-button"
              >
                Update Status
              </button>
            </form>
          )}

          {hasOrganizerAccess && (
            <form
              action={regenerateBracketAction}
              className="mt-3 d-flex flex-wrap gap-2 align-items-center"
            >
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <button
                type="submit"
                className="btn btn-sm btn-outline-light ca-glass-button"
                disabled={hasCompletedMatches}
                title={hasCompletedMatches ? "Cannot regenerate bracket after matches have been completed" : "Regenerate the tournament bracket"}
              >
                Regenerate Bracket
              </button>
              {hasCompletedMatches && (
                <small className="text-warning ms-2">
                  <i className="bi bi-lock-fill me-1"></i>
                  Locked: Matches already completed
                </small>
              )}
            </form>
          )}

          {hasOrganizerAccess && tournament.isTeamBased && (
            <div className="mt-3">
              <Link
                href={`/events/${tournament.id}/teams`}
                className="btn btn-sm btn-outline-light ca-glass-button"
              >
                Manage Teams
              </Link>
            </div>
          )}

          {canEditMatchScores && editableMatches.length > 0 && (
            <EditMatchScoreClient matches={editableMatches} />
          )}

          {isParticipant && (
            <div className="mt-3">
              {isCheckedIn ? (
                <p className="text-light small mb-0">
                  You are registered and checked in for this event.
                </p>
              ) : (
                <>
                  <p className="text-light small mb-0">
                    You are registered for this event. Check in to be seeded into the bracket.
                  </p>
                  <CheckInButton tournamentId={tournament.id} />
                </>
              )}
            </div>
          )}
        </div>

        {tournament.isTeamBased && (
          <div className="ca-feature-card mb-4 p-4">
            <h3 className="text-white mb-3">Teams</h3>
            <TeamsCardClient
              teams={tournament.teams.map((t) => ({
                id: t.id,
                name: t.name,
                members: t.members.map((m) => ({
                  id: m.user.id,
                  name: m.user.name,
                  email: m.user.email,
                })),
              }))}
            />
          </div>
        )}

        {/* Participants – uses ca-standings-table for zebra rows */}
        <ParticipantsTable participants={participantRecordsForClient} />

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
                        <Link
                          href={`/match/${match.id}`}
                          className="text-decoration-none text-light"
                        >
                          {match.p1?.user?.name ??
                            match.p1?.team?.name ??
                            "TBD"}{" "}
                          vs{" "}
                          {match.p2?.user?.name ??
                            match.p2?.team?.name ??
                            "TBD"}
                        </Link>
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
        {tournament.status !== 'completed' && (
          <div className="ca-feature-card mb-4 p-4">
            <h3 className="text-white mb-3">Invite Participants</h3>
            <p className="text-light small mb-3">
              Generate invite links to send to players or teams. They can accept the invite
              to join this event.
            </p>

            <EventInviteForm tournamentId={tournament.id} />
          </div>
        )}
      </div>
    </section>
  );
}
