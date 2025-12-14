import { test, expect } from './auth-utils';
import { resetEloSeededTournament, getTournamentParticipantSeeds, disconnectTestDb } from './db-test-utils';

// Validates skill-based (ELO) seeding by regenerating the bracket for the
// seeded tournament fixture (id=6) and asserting participant seeds update.

test.slow();

test.beforeEach(async () => {
  await resetEloSeededTournament();
});

test.afterAll(async () => {
  await disconnectTestDb();
});

test('organizer can regenerate bracket and seeds follow ELO rating order', async ({ getUserPage }) => {
  const page = await getUserPage('organizer@campusarena.test', 'password123');

  await page.goto('/events/6', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Elo Seeded Smash Bracket' })).toBeVisible();

  // Precondition: no matches yet.
  await expect(page.getByRole('heading', { name: 'Upcoming Matches' })).toBeVisible();
  await expect(page.getByText('No upcoming matches.')).toBeVisible();

  const regenerateButton = page.getByRole('button', { name: 'Regenerate Bracket' });
  await expect(regenerateButton).toBeEnabled();

  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    regenerateButton.click(),
  ]);

  // After regeneration, the seeded bracket should produce upcoming matches.
  await expect(page.getByText('No upcoming matches.')).toHaveCount(0);

  const seeds = await getTournamentParticipantSeeds(6);

  // Ratings in prisma/seed.ts for Smash:
  // player4 (2000) > player3 (1800) > player2 (1650) > player1 (1400)
  expect(seeds).toEqual([
    { email: 'player4@campusarena.test', seed: 1 },
    { email: 'player3@campusarena.test', seed: 2 },
    { email: 'player2@campusarena.test', seed: 3 },
    { email: 'player1@campusarena.test', seed: 4 },
  ]);

  // UI sanity: top seed appears first in the participants table.
  const firstRow = page.locator('.ca-standings-table table tbody tr').first();
  await expect(firstRow).toContainText('1');
  await expect(firstRow).toContainText('Sofia Chen');
});
