import { test, expect } from '@playwright/test';

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
    await expect(
      page.locator('.ca-event-card').filter({ hasText: 'Test Smash Bracket' }),
    ).toBeVisible();
    // There may be multiple cards with this title over time; just assert at
    // least one exists without strict mode.
    const bracketCards = page
      .locator('.ca-event-card')
      .filter({ hasText: 'Bracket Generation Test' });
    await expect(bracketCards.first()).toBeVisible();
  });
});
