import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient, MatchStatus, EventRole } from '@prisma/client';

const PLAYER_EMAIL = 'player1@campusarena.test';
const ADMIN_EMAIL = 'admin@campusarena.test';
const SEEDED_TOURNAMENT_ID = 1; // prisma/seed.ts uses stable IDs 1-3

function clearSavedAuthSessions(): void {
  const sessionsDir = path.join(__dirname, 'playwright-auth-sessions');
  if (!fs.existsSync(sessionsDir)) return;

  const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(sessionsDir, entry.name);

    if (entry.isDirectory()) {
      for (const subEntry of fs.readdirSync(fullPath)) {
        if (!subEntry.endsWith('.json')) continue;
        fs.unlinkSync(path.join(fullPath, subEntry));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      fs.unlinkSync(fullPath);
    }
  }
}

export default async function globalSetup(): Promise<void> {
  const repoRoot = path.resolve(__dirname, '..');

  // Avoid flaky/stale auth restores between runs.
  clearSavedAuthSessions();

  const prisma = new PrismaClient();

  const isExpectedSeedPresent = async (): Promise<boolean> => {
    const player = await prisma.user.findUnique({ where: { email: PLAYER_EMAIL } });
    if (!player) return false;

    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!admin) return false;

    const tournament = await prisma.tournament.findUnique({ where: { id: SEEDED_TOURNAMENT_ID } });
    if (!tournament) return false;

    const adminRole = await prisma.eventRoleAssignment.findFirst({
      where: {
        tournamentId: SEEDED_TOURNAMENT_ID,
        userId: admin.id,
        role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
      },
    });
    if (!adminRole) return false;

    const participant = await prisma.participant.findFirst({
      where: { tournamentId: SEEDED_TOURNAMENT_ID, userId: player.id },
    });
    if (!participant) return false;

    const match = await prisma.match.findFirst({
      where: {
        tournamentId: SEEDED_TOURNAMENT_ID,
        OR: [{ p1Id: participant.id }, { p2Id: participant.id }],
        status: { in: [MatchStatus.PENDING, MatchStatus.SCHEDULED] },
      },
    });

    return !!match;
  };

  try {
    const forceSeed = process.env.PLAYWRIGHT_FORCE_SEED === '1' || process.env.PLAYWRIGHT_FORCE_SEED === 'true';
    const skipSeed = process.env.PLAYWRIGHT_SKIP_SEED === '1' || process.env.PLAYWRIGHT_SKIP_SEED === 'true';

    const seedPresent = await isExpectedSeedPresent().catch(() => false);

    if (!skipSeed && (forceSeed || !seedPresent)) {
      // Ensure deterministic DB rows exist for E2E tests.
      execSync('npx prisma db seed', { cwd: repoRoot, stdio: 'inherit' });

      // If seeding ran, validate expected rows exist.
      const ok = await isExpectedSeedPresent();
      if (!ok) {
        throw new Error('Prisma seed completed, but expected seeded rows were not found.');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}
