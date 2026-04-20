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
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByText('Cast your estimate')).toBeVisible();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
    await expect(page.getByText('13', { exact: true })).toBeVisible();
  });

  test('shows session ID in header after creating game', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await expect(page.locator('.MuiChip-label')).toHaveText(/^Session ID: [a-f0-9]{8}$/);
  });

  test('host can vote and see results', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await expect(page.getByText('Cast your estimate')).toBeVisible();
    await page.getByText('5', { exact: true }).click();

    await expect(page.getByText('Results')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Item' })).toBeVisible();
  });

  test('host sees Next Item button after voting', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await expect(page.getByText('Cast your estimate')).toBeVisible();
    await page.getByText('5', { exact: true }).click();
    await expect(page.getByText('Results')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Item' })).toBeVisible();
  });
});

test.describe('Join a Game', () => {
  test('requires name and session ID', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByLabel('Your Name')).toBeVisible();
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
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await page.getByRole('button', { name: /Alice/i }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Dark/Light Mode', () => {
  test('toggle switches between dark and light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('pp-theme'));
    await page.reload();

    const DARK_BG = 'rgb(18, 18, 18)';
    const LIGHT_BG = 'rgb(248, 250, 252)';
    const toggle = page.getByRole('button', { name: 'Toggle dark mode' });

    // Default with dark OS preference is dark mode
    await page.waitForFunction(
      (expected) => getComputedStyle(document.body).backgroundColor === expected,
      DARK_BG,
    );

    // Toggle to light mode
    await toggle.click();
    await page.waitForFunction(
      (expected) => getComputedStyle(document.body).backgroundColor === expected,
      LIGHT_BG,
    );

    // Toggle back to dark mode
    await toggle.click();
    await page.waitForFunction(
      (expected) => getComputedStyle(document.body).backgroundColor === expected,
      DARK_BG,
    );
  });
});

// Helper to create a session and return the session ID
async function hostGame(page, name) {
  await page.goto('/host');
  await page.getByLabel('Your Name').fill(name);
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page).toHaveURL('/game');
  const chipText = await page.locator('.MuiChip-label').textContent();
  return chipText.replace(/^Session ID:\s*/, '');
}

// Helper to join a session
async function joinGame(page, name, sessionId) {
  await page.goto('/join');
  await page.getByLabel('Your Name').fill(name);
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

  test('self-initiated logout does not show kicked toast', async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const sessionId = await hostGame(hostPage, 'Alice');

    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();
    await joinGame(playerPage, 'Bob', sessionId);

    // Wait until both clients have finished subscribing
    await expect(hostPage.getByRole('main').getByText('Bob', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Deterministically reproduce the race: hold the /logout response client-side
    // for 800ms so the server-side USERS_MESSAGE broadcast always arrives first.
    await playerPage.route('**/logout', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });

    // Bob logs himself out
    await playerPage.getByRole('button', { name: /Bob/i }).click();
    await playerPage.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(playerPage).toHaveURL('/');

    // No "removed by the host" toast should appear, immediately or after a beat
    await expect(
      playerPage.getByText(/removed from the session by the host/i),
    ).not.toBeVisible();
    await playerPage.waitForTimeout(500);
    await expect(
      playerPage.getByText(/removed from the session by the host/i),
    ).not.toBeVisible();

    await hostCtx.close();
    await playerCtx.close();
  });

  test('host is visible in joiner players list in round 1 before any voting', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const sessionId = await hostGame(hostPage, 'Alice');

    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();
    await joinGame(playerPage, 'Bob', sessionId);

    // Round 1, no votes cast: joiner must see the host in the Players list
    const joinerPlayers = playerPage.getByRole('main').getByText('Alice', { exact: true });
    await expect(joinerPlayers).toBeVisible({ timeout: 10000 });

    // And the host must also see the joiner in the Players list
    const hostPlayers = hostPage.getByRole('main').getByText('Bob', { exact: true });
    await expect(hostPlayers).toBeVisible({ timeout: 10000 });

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

  test('host clicking Next Item returns non-host to voting screen', async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const sessionId = await hostGame(hostPage, 'Alice');

    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();
    await joinGame(playerPage, 'Bob', sessionId);

    // Both vote
    await hostPage.getByText('5', { exact: true }).click();
    await playerPage.getByText('8', { exact: true }).click();

    // Both see results
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 });
    await expect(playerPage.getByText('Results')).toBeVisible({ timeout: 15000 });

    // Host clicks Next Item
    await hostPage.getByRole('button', { name: 'Next Item' }).click();

    // Both should return to voting screen
    await expect(hostPage.getByText('Cast your estimate')).toBeVisible({ timeout: 10000 });
    await expect(playerPage.getByText('Cast your estimate')).toBeVisible({ timeout: 10000 });

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

test.describe('Estimation Schemes', () => {
  test('T-shirt scheme shows correct cards', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByTestId('scheme-tile-tshirt').click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByText('XS', { exact: true })).toBeVisible();
    await expect(page.getByText('S', { exact: true })).toBeVisible();
    await expect(page.getByText('M', { exact: true })).toBeVisible();
    await expect(page.getByText('L', { exact: true })).toBeVisible();
    await expect(page.getByText('XL', { exact: true })).toBeVisible();
    await expect(page.getByText('XXL', { exact: true })).toBeVisible();
    await expect(page.getByText('13', { exact: true })).not.toBeVisible();
  });

  test('Simple scheme shows correct cards', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByTestId('scheme-tile-simple').click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByText('1', { exact: true })).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await expect(page.getByText('4', { exact: true })).toBeVisible();
    await expect(page.getByText('5', { exact: true })).toBeVisible();
    await expect(page.getByText('13', { exact: true })).not.toBeVisible();
  });

  test('Custom scheme shows user-defined cards', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByTestId('scheme-tile-custom').click();
    await page.getByLabel('Custom Values').fill('Easy, Medium, Hard');
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByText('Easy', { exact: true })).toBeVisible();
    await expect(page.getByText('Medium', { exact: true })).toBeVisible();
    await expect(page.getByText('Hard', { exact: true })).toBeVisible();
  });

  test('enabling unsure toggle shows ? card', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');

    // Enable Include ? (unsure) switch (defaults OFF)
    const unsureSwitch = page.getByText('Include ? (unsure)').locator('..').locator('.MuiSwitch-input');
    await unsureSwitch.click({ force: true });

    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page).toHaveURL('/game');
    await expect(page.getByText('5', { exact: true })).toBeVisible();
    await expect(page.getByText('?', { exact: true })).toBeVisible();
  });
});

test.describe('Copy Session ID', () => {
  test('copy button shows checkmark after click', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/host');
    await page.getByLabel('Your Name').fill('Alice');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    await page.locator('.MuiChip-deleteIcon').click();
    await expect(page.locator('[data-testid="CheckIcon"]')).toBeVisible({ timeout: 2000 });
  });
});
