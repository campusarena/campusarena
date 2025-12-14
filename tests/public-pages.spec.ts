import { test, expect } from '@playwright/test';
import { test as authedTest } from './auth-utils';

test.describe('Public site pages', () => {
  test('home shows hero and upcoming events preview', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'CampusArena' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Organize\. Compete\. Connect\./i }),
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Create an event' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Browse public events' })).toBeVisible();
    await expect(page.getByText('Upcoming public events')).toBeVisible();
  });

  test('public events page lists seeded public tournaments', async ({ page }) => {
    await page.goto('/publicevents');

    await expect(page.getByRole('heading', { name: 'Browse Events' })).toBeVisible();

    // From prisma/seed.ts. Use more specific locators to avoid strict-mode
    // conflicts when there are multiple cards with the same title.
    const publicCards = page.locator('.ca-event-card');
    const publicCardCount = await publicCards.count();
    expect(publicCardCount).toBeGreaterThanOrEqual(4);

    await expect(
      page.locator('.ca-event-card').filter({ hasText: 'Test Smash Bracket' }),
    ).toBeVisible();
    // There may be multiple cards with this title over time; just assert at
    // least one exists without strict mode.
    const bracketCards = page
      .locator('.ca-event-card')
      .filter({ hasText: 'Bracket Generation Test' });
    await expect(bracketCards.first()).toBeVisible();

    await expect(
      page.locator('.ca-event-card').filter({ hasText: 'Elo Seeded Smash Bracket' }),
    ).toBeVisible();

    await expect(
      page.locator('.ca-event-card').filter({ hasText: 'Public Extra Event' }),
    ).toBeVisible();

    // Seed also creates a PRIVATE tournament that player1 is registered in.
    // The public browse page must NOT show it.
    await expect(page.getByText('Private Invite Only Event')).toHaveCount(0);
  });

  authedTest('public events page shows ONLY public events (even when logged in)', async ({ getUserPage }) => {
    const page = await getUserPage('player1@campusarena.test', 'password123');
    await page.goto('/publicevents');

    await expect(page.getByRole('heading', { name: 'Browse Events' })).toBeVisible();
    await expect(
      page.locator('.ca-event-card').filter({ hasText: 'Test Smash Bracket' }),
    ).toBeVisible();

    // Player1 is registered for this private event, but it must not appear.
    await expect(page.getByText('Private Invite Only Event')).toHaveCount(0);
  });
});
