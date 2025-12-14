// prisma/seed.ts
import {
  PrismaClient,
  Role,
  EventFormat,
  EventRole,
  MatchStatus,
  MatchSlot,
  BracketSide,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

function scorelineForSeedDiff(diff: number) {
  // Keep scores small and realistic (best-of-3 style).
  // Upsets and close matches are more likely when seeds are close.
  if (diff <= 2) return { win: 2, lose: 1 };
  return { win: 2, lose: 0 };
}

async function completeDoubleElimTournamentMatches({
  tournamentId,
  reporterUserId,
  reviewerRoleId,
}: {
  tournamentId: number;
  reporterUserId: number;
  reviewerRoleId: number;
}) {
  const participants = await prisma.participant.findMany({
    where: { tournamentId },
    select: { id: true, seed: true },
  });

  const seedByParticipantId = new Map<number, number>();
  participants.forEach((p) => seedByParticipantId.set(p.id, p.seed ?? 999));

  const applyToSlot = async (matchId: number, slot: MatchSlot, participantId: number) => {
    await prisma.match.update({
      where: { id: matchId },
      data: slot === MatchSlot.P1 ? { p1Id: participantId } : { p2Id: participantId },
    });
  };

  const forceGrandFinalReset = async () => {
    const gf1 = await prisma.match.findFirst({
      where: { tournamentId, bracket: BracketSide.FINALS, roundNumber: 1 },
      select: { id: true, p1Id: true, p2Id: true },
    });
    if (!gf1?.p1Id || !gf1?.p2Id) return;

    // Make P2 win GF1 to force the reset (so GF2 is actually played).
    const now = new Date();
    await prisma.match.update({
      where: { id: gf1.id },
      data: {
        p1Score: 1,
        p2Score: 2,
        winnerId: gf1.p2Id,
        status: MatchStatus.VERIFIED,
        completedAt: now,
      },
    });

    await prisma.matchReport.create({
      data: {
        matchId: gf1.id,
        reportedById: reporterUserId,
        p1Score: 1,
        p2Score: 2,
        winnerParticipantId: gf1.p2Id,
        status: 'APPROVED',
        reviewedAt: now,
        reviewedByRoleId: reviewerRoleId,
      },
    });

    const gf1Full = await prisma.match.findUnique({
      where: { id: gf1.id },
      select: { nextMatchId: true, p1Id: true, p2Id: true },
    });
    if (gf1Full?.nextMatchId && gf1Full.p1Id && gf1Full.p2Id) {
      await prisma.match.update({
        where: { id: gf1Full.nextMatchId },
        data: {
          p1Id: gf1Full.p1Id,
          p2Id: gf1Full.p2Id,
          p1Score: null,
          p2Score: null,
          winnerId: null,
          completedAt: null,
          status: MatchStatus.PENDING,
        },
      });
    }
  };

  // Play everything except GF1 first, so GF1 has both participants assigned.
  // Then force GF1 reset and play GF2 as well.
  let safety = 0;
  while (safety < 500) {
    safety += 1;

    const pending = await prisma.match.findMany({
      where: {
        tournamentId,
        status: MatchStatus.PENDING,
        p1Id: { not: null },
        p2Id: { not: null },
        NOT: { bracket: BracketSide.FINALS },
      },
      select: {
        id: true,
        p1Id: true,
        p2Id: true,
        nextMatchId: true,
        nextMatchSlot: true,
        loserNextMatchId: true,
        loserNextMatchSlot: true,
        bracket: true,
        roundNumber: true,
      },
      orderBy: [{ bracket: 'asc' }, { roundNumber: 'asc' }, { slotIndex: 'asc' }],
    });

    if (pending.length === 0) break;

    const match = pending[0];
    const p1Id = match.p1Id!;
    const p2Id = match.p2Id!;
    const seed1 = seedByParticipantId.get(p1Id) ?? 999;
    const seed2 = seedByParticipantId.get(p2Id) ?? 999;

    // Lower seed number is stronger.
    const winnerId = seed1 <= seed2 ? p1Id : p2Id;
    const loserId = winnerId === p1Id ? p2Id : p1Id;

    const diff = Math.abs(seed1 - seed2);
    const { win, lose } = scorelineForSeedDiff(diff);
    const p1Score = winnerId === p1Id ? win : lose;
    const p2Score = winnerId === p2Id ? win : lose;

    const now = new Date(Date.now() - 60 * 60 * 1000 + safety * 60 * 1000);

    await prisma.match.update({
      where: { id: match.id },
      data: {
        p1Score,
        p2Score,
        winnerId,
        status: MatchStatus.VERIFIED,
        completedAt: now,
      },
    });

    await prisma.matchReport.create({
      data: {
        matchId: match.id,
        reportedById: reporterUserId,
        p1Score,
        p2Score,
        winnerParticipantId: winnerId,
        status: 'APPROVED',
        reviewedAt: now,
        reviewedByRoleId: reviewerRoleId,
      },
    });

    if (match.nextMatchId && match.nextMatchSlot) {
      await applyToSlot(match.nextMatchId, match.nextMatchSlot, winnerId);
    }

    if (match.loserNextMatchId && match.loserNextMatchSlot) {
      await applyToSlot(match.loserNextMatchId, match.loserNextMatchSlot, loserId);
    }
  }

  // Now play GF1 with a forced reset (P2 wins), then play GF2.
  await forceGrandFinalReset();

  // Play GF2
  const gf2 = await prisma.match.findFirst({
    where: { tournamentId, bracket: BracketSide.FINALS, roundNumber: 2 },
    select: { id: true, p1Id: true, p2Id: true },
  });

  if (gf2?.p1Id && gf2?.p2Id) {
    const seed1 = seedByParticipantId.get(gf2.p1Id) ?? 999;
    const seed2 = seedByParticipantId.get(gf2.p2Id) ?? 999;
    const winnerId = seed1 <= seed2 ? gf2.p1Id : gf2.p2Id;
    const diff = Math.abs(seed1 - seed2);
    const { win, lose } = scorelineForSeedDiff(diff);
    const p1Score = winnerId === gf2.p1Id ? win : lose;
    const p2Score = winnerId === gf2.p2Id ? win : lose;
    const now = new Date(Date.now() - 30 * 60 * 1000);

    await prisma.match.update({
      where: { id: gf2.id },
      data: {
        p1Score,
        p2Score,
        winnerId,
        status: MatchStatus.VERIFIED,
        completedAt: now,
      },
    });

    await prisma.matchReport.create({
      data: {
        matchId: gf2.id,
        reportedById: reporterUserId,
        p1Score,
        p2Score,
        winnerParticipantId: winnerId,
        status: 'APPROVED',
        reviewedAt: now,
        reviewedByRoleId: reviewerRoleId,
      },
    });
  }

  // Finally, ensure GF1 is completed (it was forced above) and that no matches remain pending.
  const remaining = await prisma.match.count({
    where: { tournamentId, status: MatchStatus.PENDING },
  });
  if (remaining > 0) {
    throw new Error(`Seed expected all matches completed, but ${remaining} matches are still PENDING for tournament ${tournamentId}`);
  }
}

async function main() {
  console.log('Seeding CampusArena test data...');

  // ---------------------------------------------------------------------------
  // 0. Supported games (used for skill-based seeding)
  // ---------------------------------------------------------------------------
  const smashGame = await prisma.game.upsert({
    where: { key: 'smash-ultimate' },
    update: { name: 'Super Smash Bros. Ultimate', active: true },
    create: { key: 'smash-ultimate', name: 'Super Smash Bros. Ultimate', active: true },
  });
  await prisma.game.upsert({
    where: { key: 'valorant' },
    update: { name: 'VALORANT', active: true },
    create: { key: 'valorant', name: 'VALORANT', active: true },
  });
  await prisma.game.upsert({
    where: { key: 'league-of-legends' },
    update: { name: 'League of Legends', active: true },
    create: { key: 'league-of-legends', name: 'League of Legends', active: true },
  });

  // Clean up any existing test data for our known tournaments so
  // repeated seeds stay deterministic and don't accumulate rows.
  const seedTournamentIds = [1, 2, 3, 4, 5, 6, 7];

  // Delete child records that depend on tournaments 1-3.
  await prisma.matchReport.deleteMany({
    where: { match: { tournamentId: { in: seedTournamentIds } } },
  });
  await prisma.invitation.deleteMany({
    where: { tournamentId: { in: seedTournamentIds } },
  });
  await prisma.match.deleteMany({
    where: { tournamentId: { in: seedTournamentIds } },
  });
  await prisma.participant.deleteMany({
    where: { tournamentId: { in: seedTournamentIds } },
  });
  await prisma.teamMember.deleteMany({
    where: { team: { tournamentId: { in: seedTournamentIds } } },
  });
  await prisma.team.deleteMany({
    where: { tournamentId: { in: seedTournamentIds } },
  });
  await prisma.eventRoleAssignment.deleteMany({
    where: { tournamentId: { in: seedTournamentIds } },
  });

  // One shared hash for all test users
  const passwordHash = await hash('password123', 10);

  // 1. Create some users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@campusarena.test' },
    update: {},
    create: {
      email: 'admin@campusarena.test',
      password: passwordHash,
      role: Role.ADMIN,
      name: 'Admin User',
    },
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@campusarena.test' },
    update: {},
    create: {
      email: 'organizer@campusarena.test',
      password: passwordHash,
      role: Role.USER,
      name: 'Organizer User',
    },
  });

  const player1 = await prisma.user.upsert({
    where: { email: 'player1@campusarena.test' },
    update: {},
    create: {
      email: 'player1@campusarena.test',
      password: passwordHash,
      role: Role.USER,
      name: 'Player JOHN',
    },
  });

  const player2 = await prisma.user.upsert({
    where: { email: 'player2@campusarena.test' },
    update: {},
    create: {
      email: 'player2@campusarena.test',
      password: passwordHash,
      role: Role.USER,
      name: 'Player FOO',
    },
  });

  const player3 = await prisma.user.upsert({
    where: { email: 'player3@campusarena.test' },
    update: {},
    create: {
      email: 'player3@campusarena.test',
      password: passwordHash,
      role: Role.USER,
      name: 'Player BAR',
    },
  });

  const player4 = await prisma.user.upsert({
    where: { email: 'player4@campusarena.test' },
    update: {},
    create: {
      email: 'player4@campusarena.test',
      password: passwordHash,
      role: Role.USER,
      name: 'Player BAZ',
    },
  });

  // ---------------------------------------------------------------------------
  // 1b. Extra players for a 16-person seeded bracket
  // ---------------------------------------------------------------------------
  const extraPlayers = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const n = i + 5;
      return prisma.user.upsert({
        where: { email: `player${n}@campusarena.test` },
        update: {},
        create: {
          email: `player${n}@campusarena.test`,
          password: passwordHash,
          role: Role.USER,
          name: `Player ${String(n).padStart(2, '0')}`,
        },
      });
    }),
  );

  // ---------------------------------------------------------------------------
  // 1c. Deterministic ELO ratings for Smash (used by skill-based seeding)
  // ---------------------------------------------------------------------------
  const eloUsers = [player1, player2, player3, player4];
  const eloRatingsByEmail: Record<string, { rating: number; gamesPlayed: number }> = {
    'player1@campusarena.test': { rating: 1400, gamesPlayed: 10 },
    'player2@campusarena.test': { rating: 1650, gamesPlayed: 12 },
    'player3@campusarena.test': { rating: 1800, gamesPlayed: 8 },
    'player4@campusarena.test': { rating: 2000, gamesPlayed: 20 },
  };

  await Promise.all(
    eloUsers.map((u) =>
      prisma.playerGameRating.upsert({
        where: { userId_gameId: { userId: u.id, gameId: smashGame.id } },
        update: {
          rating: eloRatingsByEmail[u.email]?.rating ?? 1500,
          gamesPlayed: eloRatingsByEmail[u.email]?.gamesPlayed ?? 0,
        },
        create: {
          userId: u.id,
          gameId: smashGame.id,
          rating: eloRatingsByEmail[u.email]?.rating ?? 1500,
          gamesPlayed: eloRatingsByEmail[u.email]?.gamesPlayed ?? 0,
        },
      }),
    ),
  );

  // ---------------------------------------------------------------------------
  // 2. UPCOMING single-elim individual tournament
  // ---------------------------------------------------------------------------
  const upcomingTournament = await prisma.tournament.upsert({
    where: { id: 1 }, // arbitrary stable id
    update: {},
    create: {
      name: 'Test Smash Bracket',
      game: 'Super Smash Bros. Ultimate',
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false, // individual event
      startDate: new Date(),
      status: 'upcoming',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Campus Center',
      visibility: 'PUBLIC', // example
    },
  });

  // Event roles (OWNER + ORGANIZER) for upcoming tournament
  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: upcomingTournament.id,
        userId: adminUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: upcomingTournament.id,
      userId: adminUser.id,
      role: EventRole.OWNER,
    },
  });

  // ---------------------------------------------------------------------------
  // 2b. PRIVATE tournament (player has access via registration, but it must NOT
  // appear on the public events browse page).
  // ---------------------------------------------------------------------------
  const privateTournament = await prisma.tournament.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Private Invite Only Event',
      game: 'Test Private Game',
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      startDate: new Date(),
      status: 'upcoming',
      maxParticipants: 16,
      location: 'Private Location',
      visibility: 'PRIVATE',
    },
  });

  // Register player1 for the private event so they "have access" to it.
  await prisma.participant.create({
    data: {
      tournamentId: privateTournament.id,
      userId: player1.id,
      seed: 1,
    },
  });


  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: upcomingTournament.id,
        userId: organizerUser.id,
        role: EventRole.ORGANIZER,
      },
    },
    update: {},
    create: {
      tournamentId: upcomingTournament.id,
      userId: organizerUser.id,
      role: EventRole.ORGANIZER,
    },
  });

  // Participants for upcoming tournament
  const upcomingParticipants = await Promise.all([
    prisma.participant.create({
      data: {
        tournamentId: upcomingTournament.id,
        userId: player1.id,
        seed: 1,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: upcomingTournament.id,
        userId: player2.id,
        seed: 2,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: upcomingTournament.id,
        userId: player3.id,
        seed: 3,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: upcomingTournament.id,
        userId: player4.id,
        seed: 4,
      },
    }),
  ]);

  const [upP1, upP2, upP3, upP4] = upcomingParticipants;

  // Round 2: finals (pending)
  const upFinalMatch = await prisma.match.create({
    data: {
      tournamentId: upcomingTournament.id,
      roundNumber: 2,
      slotIndex: 1,
      status: MatchStatus.PENDING,
      location: 'Main Stage',
    },
  });

  // Round 1: semis feeding into the final (pending)
  const upSemi1 = await prisma.match.create({
    data: {
      tournamentId: upcomingTournament.id,
      roundNumber: 1,
      slotIndex: 1,
      p1Id: upP1.id, // seed 1
      p2Id: upP4.id, // seed 4
      status: MatchStatus.PENDING,
      location: 'Side Setup A',
      nextMatchId: upFinalMatch.id,
    },
  });

  const upSemi2 = await prisma.match.create({
    data: {
      tournamentId: upcomingTournament.id,
      roundNumber: 1,
      slotIndex: 2,
      p1Id: upP2.id, // seed 2
      p2Id: upP3.id, // seed 3
      status: MatchStatus.PENDING,
      location: 'Side Setup B',
      nextMatchId: upFinalMatch.id,
    },
  });

  console.log('Upcoming tournament seed complete:');
  console.log(`  Tournament: ${upcomingTournament.name} (id=${upcomingTournament.id})`);
  console.log('  Semis:', upSemi1.id, upSemi2.id, '→ Final:', upFinalMatch.id);

  // ---------------------------------------------------------------------------
  // 3. TEST tournament to exercise bracket generation logic
  // ---------------------------------------------------------------------------

  const bracketTestTournament = await prisma.tournament.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Bracket Generation Test',
      game: 'Test Game',
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      startDate: new Date(),
      status: 'upcoming',
      maxParticipants: 4,
      location: 'Test Venue',
      visibility: 'PUBLIC',
    },
  });

  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: bracketTestTournament.id,
        userId: organizerUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: bracketTestTournament.id,
      userId: organizerUser.id,
      role: EventRole.OWNER,
    },
  });

  const bracketTestParticipants = await Promise.all([
    prisma.participant.create({
      data: {
        tournamentId: bracketTestTournament.id,
        userId: player1.id,
        seed: 1,
        checkedIn: true, // uncomment after migrating schema
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: bracketTestTournament.id,
        userId: player2.id,
        seed: 2,
        checkedIn: true,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: bracketTestTournament.id,
        userId: player3.id,
        seed: 3,
        checkedIn: true,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: bracketTestTournament.id,
        userId: player4.id,
        seed: 4,
        checkedIn: true,
      },
    }),
  ]);

  // Mark all participants in the bracket-test tournament as checked in so
  // bracket generation works without manual logins.
  // NOTE: After running `npx prisma migrate dev`, you can uncomment the block
  // below to default all bracket-test participants to checked in.
  // await prisma.participant.updateMany({
  //   where: { tournamentId: bracketTestTournament.id },
  //   data: { checkedIn: true },
  // });

  console.log('Bracket test tournament seed complete:');
  console.log(
    `  Tournament: ${bracketTestTournament.name} (id=${bracketTestTournament.id}), participants=${bracketTestParticipants.length}`,
  );

  // ---------------------------------------------------------------------------
  // 4. CLEAN single-elim tournament for end-to-end bracket testing (id=2)
  // ---------------------------------------------------------------------------

  const bracketTest2Tournament = await prisma.tournament.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Bracket Generation Test 2',
      game: 'Super Smash Bros. Ultimate',
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Ballroom',
      visibility: 'PUBLIC',
    },
  });

  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: bracketTest2Tournament.id,
        userId: adminUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: bracketTest2Tournament.id,
      userId: adminUser.id,
      role: EventRole.OWNER,
    },
  });

  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: bracketTest2Tournament.id,
        userId: organizerUser.id,
        role: EventRole.ORGANIZER,
      },
    },
    update: {},
    create: {
      tournamentId: bracketTest2Tournament.id,
      userId: organizerUser.id,
      role: EventRole.ORGANIZER,
    },
  });

  await Promise.all([
    prisma.participant.create({
      data: {
        tournamentId: bracketTest2Tournament.id,
        userId: player1.id,
        seed: 1,
        checkedIn: true,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: bracketTest2Tournament.id,
        userId: player2.id,
        seed: 2,
        checkedIn: true,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: bracketTest2Tournament.id,
        userId: player3.id,
        seed: 3,
        checkedIn: true,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: bracketTest2Tournament.id,
        userId: player4.id,
        seed: 4,
        checkedIn: true,
      },
    }),
  ]);

  console.log('Clean bracket test tournament seed complete (id=2).');

  // ---------------------------------------------------------------------------
  // 5. PUBLIC, COMPLETED double-elimination tournament (id=5) with 16 players
  // ---------------------------------------------------------------------------

  const completedDoubleElim = await prisma.tournament.upsert({
    where: { id: 5 },
    update: {
      name: 'Completed Double Elim (16 Players)',
      game: 'Super Smash Bros. Ultimate',
      format: EventFormat.DOUBLE_ELIM,
      isTeamBased: false,
      status: 'completed',
      visibility: 'PUBLIC',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Test Arena',
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    create: {
      name: 'Completed Double Elim (16 Players)',
      game: 'Super Smash Bros. Ultimate',
      format: EventFormat.DOUBLE_ELIM,
      isTeamBased: false,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Test Arena',
      visibility: 'PUBLIC',
    },
  });

  const completedDoubleElimOwnerRole = await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: completedDoubleElim.id,
        userId: organizerUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: completedDoubleElim.id,
      userId: organizerUser.id,
      role: EventRole.OWNER,
    },
    select: { id: true },
  });

  const sixteenUsers = [player1, player2, player3, player4, ...extraPlayers];

  await Promise.all(
    sixteenUsers.map((u, idx) =>
      prisma.participant.create({
        data: {
          tournamentId: completedDoubleElim.id,
          userId: u.id,
          seed: idx + 1,
          checkedIn: true,
        },
      }),
    ),
  );

  // Generate a full double-elim bracket (same wiring rules as bracketService)
  const participants = await prisma.participant.findMany({
    where: { tournamentId: completedDoubleElim.id, checkedIn: true },
    orderBy: { seed: 'asc' },
    select: { id: true },
  });

  await prisma.match.deleteMany({ where: { tournamentId: completedDoubleElim.id } });

  const N = participants.length; // should be 16
  const winnersIds: number[][] = [];
  const winnersRound1IsBye: boolean[] = [];

  // Winners Round 1
  const w1Ids: number[] = [];
  for (let m = 0; m < N / 2; m += 1) {
    const p1 = participants[m * 2];
    const p2 = participants[m * 2 + 1];
    const match = await prisma.match.create({
      data: {
        tournamentId: completedDoubleElim.id,
        bracket: BracketSide.WINNERS,
        roundNumber: 1,
        slotIndex: m + 1,
        p1Id: p1?.id,
        p2Id: p2?.id,
        status: MatchStatus.PENDING,
      },
      select: { id: true },
    });
    w1Ids.push(match.id);
    winnersRound1IsBye.push(false);
  }
  winnersIds.push(w1Ids);

  // Remaining winners rounds
  let roundMatchCount = w1Ids.length;
  let winnersRoundNumber = 1;
  while (roundMatchCount > 1) {
    winnersRoundNumber += 1;
    roundMatchCount = Math.floor(roundMatchCount / 2);
    const ids: number[] = [];
    for (let i = 0; i < roundMatchCount; i += 1) {
      const match = await prisma.match.create({
        data: {
          tournamentId: completedDoubleElim.id,
          bracket: BracketSide.WINNERS,
          roundNumber: winnersRoundNumber,
          slotIndex: i + 1,
          status: MatchStatus.PENDING,
        },
        select: { id: true },
      });
      ids.push(match.id);
    }
    winnersIds.push(ids);
  }

  const k = winnersIds.length;

  // Losers rounds: 2k-2
  const losersIds: number[][] = [];
  const losersRoundCount = 2 * k - 2;
  for (let lbRound = 1; lbRound <= losersRoundCount; lbRound += 1) {
    const r = Math.floor((lbRound + 1) / 2);
    const matchCount = N / 2 ** (r + 1);
    const ids: number[] = [];
    for (let i = 0; i < matchCount; i += 1) {
      const match = await prisma.match.create({
        data: {
          tournamentId: completedDoubleElim.id,
          bracket: BracketSide.LOSERS,
          roundNumber: lbRound,
          slotIndex: i + 1,
          status: MatchStatus.PENDING,
        },
        select: { id: true },
      });
      ids.push(match.id);
    }
    losersIds.push(ids);
  }

  const grandFinal1 = await prisma.match.create({
    data: {
      tournamentId: completedDoubleElim.id,
      bracket: BracketSide.FINALS,
      roundNumber: 1,
      slotIndex: 1,
      status: MatchStatus.PENDING,
    },
    select: { id: true },
  });
  const grandFinal2 = await prisma.match.create({
    data: {
      tournamentId: completedDoubleElim.id,
      bracket: BracketSide.FINALS,
      roundNumber: 2,
      slotIndex: 1,
      status: MatchStatus.PENDING,
    },
    select: { id: true },
  });

  // Winners progression
  for (let roundIndex = 0; roundIndex < winnersIds.length - 1; roundIndex += 1) {
    const current = winnersIds[roundIndex];
    const next = winnersIds[roundIndex + 1];
    for (let i = 0; i < current.length; i += 1) {
      const parentId = next[Math.floor(i / 2)];
      const nextMatchSlot = i % 2 === 0 ? MatchSlot.P1 : MatchSlot.P2;
      await prisma.match.update({
        where: { id: current[i] },
        data: { nextMatchId: parentId, nextMatchSlot },
      });
    }
  }

  // Winners R1 losers -> Losers R1 (not byes)
  for (let i = 0; i < winnersIds[0].length; i += 1) {
    if (winnersRound1IsBye[i]) continue;
    const targetId = losersIds[0][Math.floor(i / 2)];
    const loserNextMatchSlot = i % 2 === 0 ? MatchSlot.P1 : MatchSlot.P2;
    await prisma.match.update({
      where: { id: winnersIds[0][i] },
      data: { loserNextMatchId: targetId, loserNextMatchSlot },
    });
  }

  // Winners R2..Rk losers -> Losers even rounds (P2)
  for (let r = 2; r <= k; r += 1) {
    const winnersRoundIndex = r - 1;
    const lbRoundEven = 2 * r - 2;
    const lbIndex = lbRoundEven - 1;
    for (let i = 0; i < winnersIds[winnersRoundIndex].length; i += 1) {
      await prisma.match.update({
        where: { id: winnersIds[winnersRoundIndex][i] },
        data: { loserNextMatchId: losersIds[lbIndex][i], loserNextMatchSlot: MatchSlot.P2 },
      });
    }
  }

  // Losers progression
  for (let r = 1; r <= k - 1; r += 1) {
    const oddIndex = (2 * r - 1) - 1;
    const evenIndex = (2 * r) - 1;

    for (let i = 0; i < losersIds[oddIndex].length; i += 1) {
      await prisma.match.update({
        where: { id: losersIds[oddIndex][i] },
        data: { nextMatchId: losersIds[evenIndex][i], nextMatchSlot: MatchSlot.P1 },
      });
    }

    const nextOddRound = 2 * r + 1;
    if (nextOddRound <= losersRoundCount) {
      const nextOddIndex = nextOddRound - 1;
      for (let i = 0; i < losersIds[evenIndex].length; i += 1) {
        const parentId = losersIds[nextOddIndex][Math.floor(i / 2)];
        const nextMatchSlot = i % 2 === 0 ? MatchSlot.P1 : MatchSlot.P2;
        await prisma.match.update({
          where: { id: losersIds[evenIndex][i] },
          data: { nextMatchId: parentId, nextMatchSlot },
        });
      }
    }
  }

  // Winners champ -> GF1 P1
  await prisma.match.update({
    where: { id: winnersIds[k - 1][0] },
    data: { nextMatchId: grandFinal1.id, nextMatchSlot: MatchSlot.P1 },
  });

  // Losers champ -> GF1 P2
  await prisma.match.update({
    where: { id: losersIds[losersIds.length - 1][0] },
    data: { nextMatchId: grandFinal1.id, nextMatchSlot: MatchSlot.P2 },
  });

  await prisma.match.update({
    where: { id: grandFinal1.id },
    data: { nextMatchId: grandFinal2.id },
  });

  // Populate coherent completed results for all matches.
  await completeDoubleElimTournamentMatches({
    tournamentId: completedDoubleElim.id,
    reporterUserId: organizerUser.id,
    reviewerRoleId: completedDoubleElimOwnerRole.id,
  });

  // ---------------------------------------------------------------------------
  // 6. PUBLIC, UPCOMING Elo-seeded tournament (id=6)
  //    - seedBySkill=true + supportedGameId set
  //    - participants checked in with intentionally scrambled seeds
  //    - tests will click "Regenerate Bracket" to apply ELO seeding
  // ---------------------------------------------------------------------------

  const eloSeededTournament = await prisma.tournament.upsert({
    where: { id: 6 },
    update: {
      name: 'Elo Seeded Smash Bracket',
      game: 'Super Smash Bros. Ultimate',
      supportedGameId: smashGame.id,
      seedBySkill: true,
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      status: 'upcoming',
      visibility: 'PUBLIC',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Elo Lab',
    },
    create: {
      name: 'Elo Seeded Smash Bracket',
      game: 'Super Smash Bros. Ultimate',
      supportedGameId: smashGame.id,
      seedBySkill: true,
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'upcoming',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Elo Lab',
      visibility: 'PUBLIC',
      autoBracket: false,
    },
  });

  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: eloSeededTournament.id,
        userId: organizerUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: eloSeededTournament.id,
      userId: organizerUser.id,
      role: EventRole.OWNER,
    },
  });

  // Scramble initial seeds so tests can assert that regeneration applies ELO seeding.
  // Expected ELO order: player4 > player3 > player2 > player1.
  await Promise.all([
    prisma.participant.create({
      data: { tournamentId: eloSeededTournament.id, userId: player1.id, seed: 2, checkedIn: true },
    }),
    prisma.participant.create({
      data: { tournamentId: eloSeededTournament.id, userId: player2.id, seed: 4, checkedIn: true },
    }),
    prisma.participant.create({
      data: { tournamentId: eloSeededTournament.id, userId: player3.id, seed: 1, checkedIn: true },
    }),
    prisma.participant.create({
      data: { tournamentId: eloSeededTournament.id, userId: player4.id, seed: 3, checkedIn: true },
    }),
  ]);

  console.log('ELO seeded tournament fixture created (id=6).');

  // ---------------------------------------------------------------------------
  // 7. PUBLIC, UPCOMING event (id=7) - extra public fixture so /events can show
  //    at least 4 non-completed public events for seeded users.
  // ---------------------------------------------------------------------------
  const extraPublicTournament = await prisma.tournament.upsert({
    where: { id: 7 },
    update: {
      name: 'Public Extra Event',
      game: 'Test Extra Game',
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      status: 'upcoming',
      visibility: 'PUBLIC',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Extra Venue',
    },
    create: {
      name: 'Public Extra Event',
      game: 'Test Extra Game',
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Extra Venue',
      visibility: 'PUBLIC',
    },
  });

  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: extraPublicTournament.id,
        userId: adminUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: extraPublicTournament.id,
      userId: adminUser.id,
      role: EventRole.OWNER,
    },
  });

  // Register player1 so /events lists this extra fixture.
  await prisma.participant.create({
    data: { tournamentId: extraPublicTournament.id, userId: player1.id, seed: 1, checkedIn: true },
  });

  console.log('Extra public event fixture created (id=7).');

  console.log('Completed double-elim tournament seed complete:');
  console.log(`  Tournament: ${completedDoubleElim.name} (id=${completedDoubleElim.id}), players=${participants.length}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
