/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */
import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Base configuration
// Keep this aligned with playwright.config.ts (webServer url / baseURL).
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const SESSION_STORAGE_PATH = path.join(__dirname, 'playwright-auth-sessions');

// Ensure session directory exists
if (!fs.existsSync(SESSION_STORAGE_PATH)) {
  fs.mkdirSync(SESSION_STORAGE_PATH, { recursive: true });
}

// Define our custom fixtures
interface AuthFixtures {
  getUserPage: (email: string, password: string) => Promise<Page>;
}

async function isUserDropdownVisible(page: Page, email: string, timeoutMs = 3000): Promise<boolean> {
  return page
    .getByRole('button', { name: email })
    .isVisible({ timeout: timeoutMs })
    .catch(() => false);
}

async function verifyAuthenticatedAs(page: Page, email: string): Promise<boolean> {
  // Use an authenticated-only page to force session evaluation.
  // Avoid `networkidle` (Next dev keeps connections open).
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  return isUserDropdownVisible(page, email, 8000);
}

async function authenticateViaUiAndSave(
  page: Page,
  context: BrowserContext,
  email: string,
  password: string,
  storageStatePath: string,
): Promise<void> {
  try {
    console.log(`→ Authenticating ${email} via UI...`);

    // Clear any existing cookies so we don't get redirected away from the
    // sign-in page by a stale/half-valid session.
    await context.clearCookies();
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });

    await fillFormWithRetry(page, [
      { selector: 'input[name="email"]', value: email },
      { selector: 'input[name="password"]', value: password },
    ]);

    const submitButton = page.locator('form').getByRole('button', { name: /sign[ -]?in/i });
    const clickLocator = (await submitButton.isVisible({ timeout: 1000 }))
      ? submitButton
      : page.getByRole('button', { name: /log[ -]?in/i });

    // next-auth `signIn(..., { callbackUrl: '/dashboard' })` triggers a client-side
    // redirect. Wait for that navigation explicitly.
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      clickLocator.click(),
    ]);

    await expect(page.getByRole('button', { name: email })).toBeVisible({ timeout: 15000 });

    await context.storageState({ path: storageStatePath });
    console.log(`✓ Successfully authenticated ${email} and saved session`);
  } catch (error) {
    console.error(`× Authentication failed for ${email}:`, error);
    throw new Error(`Authentication failed: ${error}`);
  }
}

/**
 * Helper to fill form fields with retry logic
 */
async function fillFormWithRetry(
  page: Page,
  fields: Array<{ selector: string; value: string }>
): Promise<void> {
  for (const field of fields) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const element = page.locator(field.selector);
        await element.waitFor({ state: 'visible', timeout: 2000 });
        await element.clear();
        await element.fill(field.value);
        await element.evaluate((el) => el.blur()); // Trigger blur event
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to fill field ${field.selector} after ${maxAttempts} attempts`);
        }
        await page.waitForTimeout(500);
      }
    }
  }
}

// Create custom test with authenticated fixtures
export const test = base.extend<AuthFixtures>({
  getUserPage: async ({ browser }, use, testInfo) => {
    const contexts: BrowserContext[] = [];

    const createUserPage = async (email: string, password: string) => {
      const projectSessionsDir = path.join(SESSION_STORAGE_PATH, testInfo.project.name);
      if (!fs.existsSync(projectSessionsDir)) {
        fs.mkdirSync(projectSessionsDir, { recursive: true });
      }

      const storageStatePath = path.join(projectSessionsDir, `session-${email}.json`);

      if (fs.existsSync(storageStatePath)) {
        const restoredContext = await browser.newContext({ baseURL: BASE_URL, storageState: storageStatePath });
        contexts.push(restoredContext);
        const restoredPage = await restoredContext.newPage();

        if (await verifyAuthenticatedAs(restoredPage, email)) {
          console.log(`✓ Restored session for ${email}`);
          return restoredPage;
        }

        await restoredContext.close();
        console.log(`× Saved session for ${email} expired, re-authenticating...`);
      }

      const context = await browser.newContext({ baseURL: BASE_URL });
      contexts.push(context);
      const page = await context.newPage();

      await authenticateViaUiAndSave(page, context, email, password, storageStatePath);
      return page;
    };

    await use(createUserPage);

    await Promise.all(
      contexts.map(async (ctx) => {
        try {
          await ctx.close();
        } catch {
          // ignore
        }
      }),
    );
  },
});

export { expect } from '@playwright/test';
