import { EventRole, MatchStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import BackButton from '@/components/BackButton';
import ConfirmActionForm from '@/components/ConfirmActionForm';
import { deleteTeamAction, moveTeamMemberAction } from '../../../../lib/teamAdminActions';

export default async function ManageTeamsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { locked?: string };
}) {
  const session = await getServerSession(authOptions);
  const typedUser = session?.user as { id?: string | number } | undefined;
  const currentUserId = typedUser?.id ? Number(typedUser.id) : null;

  if (!currentUserId) {
    redirect('/auth/signin');
  }

  const tournamentId = Number(params.id);
  if (!tournamentId || Number.isNaN(tournamentId)) {
    redirect('/events');
  }

  const role = await prisma.eventRoleAssignment.findFirst({
    where: {
      tournamentId,
      userId: currentUserId,
      role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
    },
  });

  if (!role) {
    redirect('/not-authorized');
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: {
        orderBy: { createdAt: 'asc' },
        include: {
          members: {
            orderBy: { isCaptain: 'desc' },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!tournament) {
    redirect('/events');
  }

  if (!tournament.isTeamBased) {
    return (
      <section className="ca-standings-page">
        <div className="container py-5 text-white">
          <BackButton label="← Back" fallbackHref={`/events/${tournamentId}`} />
          <h1 className="mt-3">This event is not team-based.</h1>
        </div>
      </section>
    );
  }

  const startedMatchCount = await prisma.match.count({
    where: {
      tournamentId,
      OR: [
        { completedAt: { not: null } },
        { status: { in: [MatchStatus.IN_PROGRESS, MatchStatus.REPORTED, MatchStatus.VERIFIED, MatchStatus.COMPLETE] } },
      ],
    },
  });

  const isLocked = startedMatchCount > 0;
  const showLockedNotice = isLocked || searchParams?.locked === '1';

  return (
    <section className="ca-standings-page">
      <div className="container py-5">
        <div className="mb-4">
          <BackButton label="← Back" fallbackHref={`/events/${tournamentId}`} />
        </div>

        <div className="row mb-4 text-center">
          <div className="col">
            <h1 className="fw-bold text-white mb-2">Manage Teams</h1>
            <p className="ca-section-subtitle mb-0">{tournament.name}</p>
          </div>
        </div>

        <div className="ca-feature-card p-4">
          {showLockedNotice && (
            <div className="alert alert-warning mb-3" role="alert">
              Team management is locked because matches have started.
            </div>
          )}

          {tournament.teams.length === 0 ? (
            <p className="text-light mb-0">No teams yet.</p>
          ) : (
            <div className="ca-standings-table mt-3">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Members</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.teams.map((team) => (
                    <tr key={team.id}>
                      <td className="text-white fw-semibold">
                        {team.name}
                      </td>
                      <td>
                        {team.members.length === 0 ? (
                          <span className="text-light small">No members</span>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                            {team.members.map((m) => (
                              <div key={m.id} className="d-flex flex-wrap gap-2 align-items-center">
                                <span className="text-light small">
                                  {m.user.name ?? m.user.email}
                                  {m.isCaptain ? <span className="ms-1">(Captain)</span> : null}
                                </span>

                                {isLocked ? (
                                  <div className="d-flex gap-2 align-items-center">
                                    <select
                                      className="form-select form-select-sm w-auto"
                                      defaultValue={team.id}
                                      aria-label="Move member to team"
                                      disabled
                                    >
                                      {tournament.teams.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                          {opt.name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-light ca-glass-button"
                                      disabled
                                      title="Team management is locked once matches start."
                                    >
                                      Move
                                    </button>
                                  </div>
                                ) : (
                                  <form action={moveTeamMemberAction} className="d-flex gap-2 align-items-center">
                                    <input type="hidden" name="tournamentId" value={tournamentId} />
                                    <input type="hidden" name="userId" value={m.userId} />
                                    <input type="hidden" name="fromTeamId" value={team.id} />
                                    <select
                                      name="toTeamId"
                                      className="form-select form-select-sm w-auto"
                                      defaultValue={team.id}
                                      aria-label="Move member to team"
                                    >
                                      {tournament.teams.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                          {opt.name}
                                        </option>
                                      ))}
                                    </select>
                                    <button type="submit" className="btn btn-sm btn-outline-light ca-glass-button">
                                      Move
                                    </button>
                                  </form>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="text-end">
                        {isLocked ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-light ca-glass-button"
                            disabled
                            title="Team management is locked once matches start."
                          >
                            Delete
                          </button>
                        ) : (
                          <ConfirmActionForm
                            action={deleteTeamAction}
                            confirmMessage={`Delete team "${team.name}"? This will remove members and detach the team from any matches.`}
                          >
                            <input type="hidden" name="tournamentId" value={tournamentId} />
                            <input type="hidden" name="teamId" value={team.id} />
                            <button type="submit" className="btn btn-sm btn-outline-light ca-glass-button">
                              Delete
                            </button>
                          </ConfirmActionForm>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
