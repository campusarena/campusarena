import { test, expect } from './auth-utils';
import {
  resetTeamBasedTournament,
  getTeamEventJoinToken,
  getTeamEventTournamentId,
  disconnectTestDb,
} from './db-test-utils';

test.slow();

test.beforeEach(async () => {
  await resetTeamBasedTournament();
});

test.afterAll(async () => {
  await disconnectTestDb();
});

test('player can create a team via join token', async ({ getUserPage }) => {
  const tournamentId = getTeamEventTournamentId();
  const token = getTeamEventJoinToken('player1');

  const page = await getUserPage('player1@campusarena.test', 'password123');

  await page.goto(`/events/${tournamentId}/teams/join?token=${encodeURIComponent(token)}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.getByRole('heading', { name: 'Join a Team' })).toBeVisible();

  await page.getByPlaceholder('Team name').fill('Team Rocket');

  await Promise.all([
    page.waitForURL(`**/events/${tournamentId}`, { timeout: 15000 }),
    page.getByRole('button', { name: 'Create Team' }).click(),
  ]);

  const teamsSection = page.locator('.ca-feature-card', {
    has: page.getByRole('heading', { name: 'Teams' }),
  });

  await expect(teamsSection.getByText('Team Rocket')).toBeVisible();

  // Expand team card to ensure membership is rendered.
  const teamCardButton = teamsSection.locator('button', { hasText: 'Team Rocket' });
  await teamCardButton.click();
  await expect(teamsSection.getByText('John Nakamura')).toBeVisible();
});

test('player can join an existing team via join token', async ({ getUserPage }) => {
  const tournamentId = getTeamEventTournamentId();
  const token = getTeamEventJoinToken('player2');

  const page = await getUserPage('player2@campusarena.test', 'password123');

  await page.goto(`/events/${tournamentId}/teams/join?token=${encodeURIComponent(token)}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.getByRole('heading', { name: 'Join a Team' })).toBeVisible();

  const teamSelect = page.getByLabel('Select team');
  const seedTeamValue = await teamSelect.evaluate((el) => {
    const select = el as HTMLSelectElement;
    const opt = Array.from(select.options).find((o) => o.text.includes('Seed Team Alpha'));
    return opt?.value ?? '';
  });
  expect(seedTeamValue).not.toBe('');
  await teamSelect.selectOption(seedTeamValue);

  await Promise.all([
    page.waitForURL(`**/events/${tournamentId}`, { timeout: 15000 }),
    page.getByRole('button', { name: 'Join' }).click(),
  ]);

  const teamsSection = page.locator('.ca-feature-card', {
    has: page.getByRole('heading', { name: 'Teams' }),
  });

  await expect(teamsSection.getByText('Seed Team Alpha')).toBeVisible();

  const teamCardButton = teamsSection.locator('button', { hasText: 'Seed Team Alpha' });
  await teamCardButton.click();
  await expect(teamsSection.getByText('Maya Patel')).toBeVisible();
});

test('organizer can access Manage Teams for a team-based event', async ({ getUserPage }) => {
  const tournamentId = getTeamEventTournamentId();

  const page = await getUserPage('organizer@campusarena.test', 'password123');

  await page.goto(`/events/${tournamentId}`, { waitUntil: 'domcontentloaded' });

  const manageTeamsLink = page.getByRole('link', { name: 'Manage Teams' });
  await expect(manageTeamsLink).toBeVisible();

  await Promise.all([
    page.waitForURL(`**/events/${tournamentId}/teams`, { timeout: 15000 }),
    manageTeamsLink.click(),
  ]);

  await expect(page.getByRole('heading', { name: 'Manage Teams' })).toBeVisible();
  await expect(page.getByText('Seed Team Alpha')).toBeVisible();
  await expect(page.getByText('Team management is locked because matches have started.')).toHaveCount(0);
});
