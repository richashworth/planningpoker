import { test, expect } from '@playwright/test';

test.describe('Welcome Page', () => {
  test('shows join and host buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h3')).toHaveText('Planning Poker');
    await expect(page.getByRole('link', { name: 'Join Game' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Host New Game' })).toBeVisible();
  });

  test('navigates to host page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Host New Game' }).click();
    await expect(page).toHaveURL('/host');
    await expect(page.getByRole('heading', { name: 'Host a Game' })).toBeVisible();
  });

  test('navigates to join page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Join Game' }).click();
    await expect(page).toHaveURL('/join');
    await expect(page.getByRole('heading', { name: 'Join a Game' })).toBeVisible();
  });
});

test.describe('Host a Game', () => {
  test('creates a session and shows vote cards', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByText('Cast your estimate')).toBeVisible();
    await expect(page.getByText('0', { exact: true })).toBeVisible();
    await expect(page.getByText('13', { exact: true })).toBeVisible();
    await expect(page.getByText('?', { exact: true })).toBeVisible();
  });

  test('shows session ID in header after creating game', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await expect(page.locator('.MuiChip-label')).toHaveText(/^[a-f0-9]{8}$/);
  });

  test('host can vote and see results', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await page.getByText('5', { exact: true }).click();

    await expect(page.getByText('Results')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Item' })).toBeVisible();
  });

  test('host sees Next Item button after voting', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();

    await page.getByText('5', { exact: true }).click();
    await expect(page.getByText('Results')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Item' })).toBeVisible();
  });
});

test.describe('Join a Game', () => {
  test('requires name and session ID', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Session ID')).toBeVisible();
  });

  test('redirects to home if accessing /game without session', async ({ page }) => {
    await page.goto('/game');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Logout', () => {
  test('log out returns to welcome page', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Dark/Light Mode', () => {
  test('toggle switches between dark and light mode', async ({ page }) => {
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Toggle dark mode' });
    await expect(toggle).toBeVisible();

    // Default is dark mode
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await toggle.click();
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(lightBg).not.toBe(darkBg);

    await toggle.click();
    const backToDarkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(backToDarkBg).toBe(darkBg);
  });
});

// Helper to create a session and return the session ID
async function hostGame(page, name) {
  await page.goto('/host');
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page).toHaveURL('/game');
  return await page.locator('.MuiChip-label').textContent();
}

// Helper to join a session
async function joinGame(page, name, sessionId) {
  await page.goto('/join');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Session ID').fill(sessionId);
  await page.getByRole('button', { name: 'Join Game' }).click();
  await expect(page).toHaveURL('/game');
}

test.describe('Multi-User Flows', () => {
  test('two users can join the same session and both vote', async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const sessionId = await hostGame(hostPage, 'Alice');

    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();
    await joinGame(playerPage, 'Bob', sessionId);

    // Both should see vote cards
    await expect(hostPage.getByText('Cast your estimate')).toBeVisible();
    await expect(playerPage.getByText('Cast your estimate')).toBeVisible();

    // Both vote
    await hostPage.getByText('8', { exact: true }).click();
    await playerPage.getByText('5', { exact: true }).click();

    // Both should see results (via WebSocket broadcast)
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 });
    await expect(playerPage.getByText('Results')).toBeVisible({ timeout: 15000 });

    // Only host sees Next Item
    await expect(hostPage.getByRole('button', { name: 'Next Item' })).toBeVisible();
    await expect(playerPage.getByRole('button', { name: 'Next Item' })).not.toBeVisible();

    await hostCtx.close();
    await playerCtx.close();
  });

  test('non-host does not see Next Item button', async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const sessionId = await hostGame(hostPage, 'Alice');

    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();
    await joinGame(playerPage, 'Bob', sessionId);

    // Both vote
    await hostPage.getByText('3', { exact: true }).click();
    await playerPage.getByText('3', { exact: true }).click();

    // Wait for results
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 });
    await expect(playerPage.getByText('Results')).toBeVisible({ timeout: 15000 });

    // Only host sees Next Item
    await expect(hostPage.getByRole('button', { name: 'Next Item' })).toBeVisible();
    await expect(playerPage.getByRole('button', { name: 'Next Item' })).not.toBeVisible();

    await hostCtx.close();
    await playerCtx.close();
  });

  test('three users vote and all see results', async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const sessionId = await hostGame(hostPage, 'Alice');

    const p2Ctx = await browser.newContext();
    const p2Page = await p2Ctx.newPage();
    await joinGame(p2Page, 'Bob', sessionId);

    const p3Ctx = await browser.newContext();
    const p3Page = await p3Ctx.newPage();
    await joinGame(p3Page, 'Charlie', sessionId);

    // All vote (stagger slightly to avoid race)
    await hostPage.getByText('5', { exact: true }).click();
    await p2Page.getByText('8', { exact: true }).click();
    await p3Page.getByText('5', { exact: true }).click();

    // All see results
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 });
    await expect(p2Page.getByText('Results')).toBeVisible({ timeout: 15000 });
    await expect(p3Page.getByText('Results')).toBeVisible({ timeout: 15000 });

    await hostCtx.close();
    await p2Ctx.close();
    await p3Ctx.close();
  });
});

test.describe('Copy Session ID', () => {
  test('copy button shows checkmark after click', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await page.locator('.MuiChip-deleteIcon').click();
    await expect(page.locator('[data-testid="CheckIcon"]')).toBeVisible({ timeout: 2000 });
  });
});
