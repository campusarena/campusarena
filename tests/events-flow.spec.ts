import { test, expect } from './auth-utils';

// Covers authenticated events list and event detail pages for a seeded player.
test.slow();

test('player sees their events list and can open event details', async ({ getUserPage }) => {
  const page = await getUserPage('player1@campusarena.test', 'password123');

  // Don't clear cookies here: `getUserPage` authenticates by setting cookies.
  // Clearing them logs the user out and can cause redirects back to sign-in.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto('/events', { waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
    } catch (e) {
      if (attempt === 1) throw e;
      await page.waitForTimeout(500);
    }
  }

  if (page.url().includes('/auth/signin')) {
    throw new Error(`Expected to be authenticated, but was redirected to: ${page.url()}`);
  }

  await expect(page.getByRole('heading', { name: 'Your Events' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Test Smash Bracket')).toBeVisible();

  // Open details for the "Test Smash Bracket" event specifically
  const testSmashCard = page
    .locator('.ca-feature-card')
    .filter({ hasText: 'Test Smash Bracket' });

  await testSmashCard.getByRole('link', { name: 'View Details' }).click();

  // Event detail page: heading is the tournament name
  await expect(page.getByRole('heading', { name: 'Test Smash Bracket' })).toBeVisible();

  // Participants table headers (scope to the table so we don't match the
  // sort dropdown options).
  const participantsTableHead = page.locator('.ca-standings-table table thead');
  // Note: these <th> elements don't set `scope="col"`, so they are exposed as
  // role=cell in some browsers.
  await expect(participantsTableHead.getByRole('cell', { name: 'Seed' })).toBeVisible();
  await expect(participantsTableHead.getByRole('cell', { name: 'Player / Team' })).toBeVisible();
  await expect(participantsTableHead.getByRole('cell', { name: 'Record' })).toBeVisible();

  // Upcoming Matches section heading
  await expect(page.getByRole('heading', { name: 'Upcoming Matches' })).toBeVisible();
});
