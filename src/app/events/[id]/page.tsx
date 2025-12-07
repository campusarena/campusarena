import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import EventInviteForm from '@/components/EventInviteForm';

const prisma = new PrismaClient();

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

  const upcomingMatches = tournament.matches.filter(
    (m) => m.status === "PENDING" || m.status === "SCHEDULED",
  );

  return (
    <section className="ca-standings-page">
      <div className="container py-5">
        {/* Back to Standings */}
        <div className="mb-4">
          <Link
            href="/standings"
            className="btn btn-sm btn-outline-light ca-glass-button"
          >
            ← Back to standings
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
            <strong>Location:</strong> {tournament.location}
          </p>
          <p>
            <strong>Start Date:</strong>{" "}
            {tournament.startDate.toDateString()}
          </p>
          <p>
            <strong>Status:</strong> {tournament.status}
          </p>
        </div>

        {/* Participants – uses ca-standings-table for zebra rows */}
        <div className="ca-feature-card mb-4 p-4">
          <h3 className="text-white mb-3">Participants</h3>

          <div className="ca-standings-table mt-3">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th className="text-center">Seed</th>
                  <th>Player / Team</th>
                </tr>
              </thead>
              <tbody>
                {tournament.participants.map((p) => (
                  <tr key={p.id}>
                    <td className="text-center">{p.seed}</td>
                    <td>{p.user?.email ?? p.team?.name ?? "Unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                    <th>Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="text-center">{match.roundNumber}</td>
                      <td>
                        {match.p1?.user?.email ??
                          match.p1?.team?.name ??
                          "TBD"}{" "}
                        vs{" "}
                        {match.p2?.user?.email ??
                          match.p2?.team?.name ??
                          "TBD"}
                      </td>
                      <td>{match.location ?? "TBD"}</td>
                      <td>
                        {match.scheduledAt
                          ? match.scheduledAt.toLocaleString()
                          : "TBD"}
                      </td>
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