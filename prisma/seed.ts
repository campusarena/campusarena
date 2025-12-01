// prisma/seed.ts
import { PrismaClient, Role, EventFormat, EventRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CampusArena test data...');

  // 1. Create some users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@campusarena.test' },
    update: {},
    create: {
      email: 'admin@campusarena.test',
      password: 'password123', // TODO: hash in a real app
      role: Role.ADMIN,
    },
  });

  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@campusarena.test' },
    update: {},
    create: {
      email: 'organizer@campusarena.test',
      password: 'password123',
      role: Role.USER,
    },
  });

  const player1 = await prisma.user.upsert({
    where: { email: 'player1@campusarena.test' },
    update: {},
    create: {
      email: 'player1@campusarena.test',
      password: 'password123',
      role: Role.USER,
    },
  });

  const player2 = await prisma.user.upsert({
    where: { email: 'player2@campusarena.test' },
    update: {},
    create: {
      email: 'player2@campusarena.test',
      password: 'password123',
      role: Role.USER,
    },
  });

  const player3 = await prisma.user.upsert({
    where: { email: 'player3@campusarena.test' },
    update: {},
    create: {
      email: 'player3@campusarena.test',
      password: 'password123',
      role: Role.USER,
    },
  });

  const player4 = await prisma.user.upsert({
    where: { email: 'player4@campusarena.test' },
    update: {},
    create: {
      email: 'player4@campusarena.test',
      password: 'password123',
      role: Role.USER,
    },
  });

  // 2. Create a single-elim individual tournament
  const tournament = await prisma.tournament.upsert({
    where: { id: 1 }, // arbitrary; if it doesn't exist, it's created
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
    },
  });

  // 3. Assign event roles (OWNER + ORGANIZER)
  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: tournament.id,
        userId: adminUser.id,
        role: EventRole.OWNER,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      userId: adminUser.id,
      role: EventRole.OWNER,
    },
  });

  await prisma.eventRoleAssignment.upsert({
    where: {
      tournamentId_userId_role: {
        tournamentId: tournament.id,
        userId: organizerUser.id,
        role: EventRole.ORGANIZER,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      userId: organizerUser.id,
      role: EventRole.ORGANIZER,
    },
  });

  // 4. Create participants (individuals)
  const participants = await Promise.all([
    prisma.participant.create({
      data: {
        tournamentId: tournament.id,
        userId: player1.id,
        seed: 1,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: tournament.id,
        userId: player2.id,
        seed: 2,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: tournament.id,
        userId: player3.id,
        seed: 3,
      },
    }),
    prisma.participant.create({
      data: {
        tournamentId: tournament.id,
        userId: player4.id,
        seed: 4,
      },
    }),
  ]);

  // Just to make things readable:
  const [p1, p2, p3, p4] = participants;

  // 5. Create a 4-player single-elim bracket
  // Round 2: final match (we create this first so semis can point to it)
  const finalMatch = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      roundNumber: 2,
      slotIndex: 1,
      status: 'PENDING',
      location: 'Main Stage',
    },
  });

  // Round 1: two semi-final matches feeding into the final
  const semi1 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      roundNumber: 1,
      slotIndex: 1,
      p1Id: p1.id, // seed 1
      p2Id: p4.id, // seed 4
      status: 'PENDING',
      location: 'Side Setup A',
      nextMatchId: finalMatch.id,
    },
  });

  const semi2 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      roundNumber: 1,
      slotIndex: 2,
      p1Id: p2.id, // seed 2
      p2Id: p3.id, // seed 3
      status: 'PENDING',
      location: 'Side Setup B',
      nextMatchId: finalMatch.id,
    },
  });

  console.log('Seed complete:');
  console.log(`  Tournament: ${tournament.name} (id=${tournament.id})`);
  console.log('  Semis:', semi1.id, semi2.id, '→ Final:', finalMatch.id);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
