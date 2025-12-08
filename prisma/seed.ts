// prisma/seed.ts
import {
  PrismaClient,
  Role,
  EventFormat,
  EventRole,
  MatchStatus,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CampusArena test data...');

  // Clean up any existing test data for our known tournaments so
  // repeated seeds stay deterministic and don't accumulate rows.
  const seedTournamentIds = [1, 2, 3];

  // Delete child records that depend on tournaments 1-3.
  await prisma.matchReport.deleteMany({
    where: { match: { tournamentId: { in: seedTournamentIds } } },
  });
  await prisma.match.deleteMany({
    where: { tournamentId: { in: seedTournamentIds } },
  });
  await prisma.participant.deleteMany({
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
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
