import { test, expect } from './auth-utils';

test.slow();
test('can authenticate a specific user', async ({ getUserPage }) => {
  // Authenticate as a seeded regular player user
  const customUserPage = await getUserPage('player1@campusarena.test', 'password123');

  // Navigate to the home page
  await customUserPage.goto('/');

  // Verify common navigation is visible
  await expect(customUserPage.getByRole('link', { name: 'CampusArena' })).toBeVisible();
  await expect(customUserPage.getByRole('link', { name: 'Public Events' })).toBeVisible();
  await expect(customUserPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();

  // User email should appear in the navbar dropdown title
  await expect(customUserPage.getByText('player1@campusarena.test')).toBeVisible();
});
