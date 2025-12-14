import { test, expect } from './auth-utils';

test.slow();

test('suite covers upcoming, ongoing, and completed events', async ({ getUserPage }) => {
  const page = await getUserPage('player1@campusarena.test', 'password123');

  // Public browse should include both UPCOMING and ONGOING public events.
  await page.goto('/publicevents', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Browse Events' })).toBeVisible();

  await expect(page.getByText('Test Smash Bracket')).toBeVisible();
  await expect(page.getByText('Ongoing Smash Night')).toBeVisible();
  await expect(page.getByText('Completed Double Elim (16 Players)')).toHaveCount(0);

  // Upcoming event detail shows status=upcoming.
  await page.goto('/events/1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Test Smash Bracket' })).toBeVisible();
  await expect(page.getByText(/Status:\s*upcoming/i)).toBeVisible();

  // Ongoing event detail shows status=ongoing.
  await page.goto('/events/9', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Ongoing Smash Night' })).toBeVisible();
  await expect(page.getByText(/Status:\s*ongoing/i)).toBeVisible();

  // Archived page contains completed events for the current user.
  await page.goto('/archivedevents', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Archived Events' })).toBeVisible();
  await expect(page.getByText('Completed Double Elim (16 Players)')).toBeVisible();

  // Open the completed event and assert status=completed.
  const completedCard = page.locator('.ca-event-card').filter({ hasText: 'Completed Double Elim (16 Players)' });
  await completedCard.getByRole('link', { name: /view details/i }).click();
  await expect(page.getByRole('heading', { name: 'Completed Double Elim (16 Players)' })).toBeVisible();
  await expect(page.getByText(/Status:\s*completed/i)).toBeVisible();
});
