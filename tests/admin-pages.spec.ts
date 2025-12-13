import { test, expect } from './auth-utils';

test.slow();
test('test access to admin page', async ({ getUserPage }) => {
  // Authenticate as seeded admin user
  const adminPage = await getUserPage('admin@campusarena.test', 'password123');

  // Navigate to the home page
  await adminPage.goto('/');

  // Check for navigation elements in the CampusArena navbar
  await expect(adminPage.getByRole('link', { name: 'CampusArena' })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Public Events' })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Dashboard' })).toBeVisible();

  // Admin dropdown with email should be visible somewhere on the page
  await expect(adminPage.getByText('admin@campusarena.test')).toBeVisible();

  // Admin dashboard should be accessible
  // Some dev-server refreshes can interrupt navigation, so retry once.
  let navigated = false;
  for (let attempt = 0; attempt < 2 && !navigated; attempt += 1) {
    try {
      await adminPage.goto('/admin');
      navigated = true;
    } catch (e) {
      if (attempt === 1) throw e;
      await adminPage.waitForTimeout(500);
    }
  }

  await expect(adminPage.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
});