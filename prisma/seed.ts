// prisma/seed.ts
import {
  PrismaClient,
  Role,
  EventFormat,
  EventRole,
  MatchStatus,
  ReportStatus,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CampusArena test data...');

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
    },
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@campusarena.test' },
    update: {},
    create: {
      email: 'organizer@campusarena.test',
      password: passwordHash,
      role: Role.USER,
    },
  });

  const player1 = await prisma.user.upsert({
    where: { email: 'player1@campusarena.test' },
    update: {},
    create: {
      email: 'player1@campusarena.test',
      password: passwordHash,
      role: Role.USER,
    },
  });

  const player2 = await prisma.user.upsert({
    where: { email: 'player2@campusarena.test' },
    update: {},
    create: {
      email: 'player2@campusarena.test',
      password: passwordHash,
      role: Role.USER,
    },
  });

  const player3 = await prisma.user.upsert({
    where: { email: 'player3@campusarena.test' },
    update: {},
    create: {
      email: 'player3@campusarena.test',
      password: passwordHash,
      role: Role.USER,
    },
  });

  const player4 = await prisma.user.upsert({
    where: { email: 'player4@campusarena.test' },
    update: {},
    create: {
      email: 'player4@campusarena.test',
      password: passwordHash,
      role: Role.USER,
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
  // 3. COMPLETED single-elim tournament for dashboard "recent results"
  // ---------------------------------------------------------------------------

  const completedTournament = await prisma.tournament.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Completed Smash Bracket',
      game: 'Super Smash Bros. Ultimate',
      format: EventFormat.SINGLE_ELIM,
      isTeamBased: false,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'completed',
      maxParticipants: 16,
      location: 'UH Mānoa Campus - Ballroom',
      visibility: 'PUBLIC', // example
    },
  });

  // Event roles for completed tournament
  const completedOwnerRole = await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: completedTournament.id,
        userId: adminUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: completedTournament.id,
      userId: adminUser.id,
      role: EventRole.OWNER,
    },
  });

  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: completedTournament.id,
        userId: organizerUser.id,
        role: EventRole.ORGANIZER,
      },
    },
    update: {},
    create: {
      tournamentId: completedTournament.id,
      userId: organizerUser.id,
      role: EventRole.ORGANIZER,
    },
  });

  // Participants for completed tournament (same players, new Participant rows)
  const completedParticipants = await Promise.all([
    prisma.participant.create({
      data: {
        tournamentId: completedTournament.id,
        userId: player1.id,
        seed: 1,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: completedTournament.id,
        userId: player2.id,
        seed: 2,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: completedTournament.id,
        userId: player3.id,
        seed: 3,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: completedTournament.id,
        userId: player4.id,
        seed: 4,
      },
    }),
  ]);

  const [cP1, cP2, cP3, cP4] = completedParticipants;

  // ROUND 1: semis (both VERIFIED)
  const completedTimeSemi1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  const completedTimeSemi2 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000); // +1h

  const cSemi1 = await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      roundNumber: 1,
      slotIndex: 1,
      p1Id: cP1.id,
      p2Id: cP4.id,
      p1Score: 2,
      p2Score: 0,
      winnerId: cP1.id,
      status: MatchStatus.VERIFIED,
      location: 'Side Setup A',
      scheduledAt: completedTimeSemi1,
      completedAt: completedTimeSemi1,
    },
  });

  const cSemi2 = await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      roundNumber: 1,
      slotIndex: 2,
      p1Id: cP2.id,
      p2Id: cP3.id,
      p1Score: 2,
      p2Score: 1,
      winnerId: cP2.id,
      status: MatchStatus.VERIFIED,
      location: 'Side Setup B',
      scheduledAt: completedTimeSemi2,
      completedAt: completedTimeSemi2,
    },
  });

  // ROUND 2: final (VERIFIED)
  const completedTimeFinal = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  const cFinal = await prisma.match.create({
    data: {
      tournamentId: completedTournament.id,
      roundNumber: 2,
      slotIndex: 1,
      p1Id: cP1.id, // winner of semi1
      p2Id: cP2.id, // winner of semi2
      p1Score: 3,
      p2Score: 1,
      winnerId: cP1.id,
      status: MatchStatus.VERIFIED,
      location: 'Main Stage',
      scheduledAt: completedTimeFinal,
      completedAt: completedTimeFinal,
    },
  });

  // Link semis to final via nextMatchId for bracket wiring
  await prisma.match.update({
    where: { id: cSemi1.id },
    data: { nextMatchId: cFinal.id },
  });

  await prisma.match.update({
    where: { id: cSemi2.id },
    data: { nextMatchId: cFinal.id },
  });

  // One approved MatchReport for the final
  await prisma.matchReport.create({
    data: {
      matchId: cFinal.id,
      reportedById: player1.id, // winner reports
      p1Score: 3,
      p2Score: 1,
      winnerParticipantId: cP1.id,
      status: ReportStatus.APPROVED,
      createdAt: completedTimeFinal,
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30min
      reviewedByRoleId: completedOwnerRole.id,
    },
  });

  console.log('Completed tournament seed complete:');
  console.log(`  Tournament: ${completedTournament.name} (id=${completedTournament.id})`);
  console.log('  Semis:', cSemi1.id, cSemi2.id, '→ Final:', cFinal.id);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
