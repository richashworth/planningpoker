import { test, expect } from '@playwright/test'

// Helper: create a session WITHOUT timer enabled, return sessionId
async function hostGame(page, name) {
  await page.goto('/host')
  await page.getByLabel('Your Name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page).toHaveURL('/game')
  const chipText = await page.locator('.MuiChip-label').textContent()
  return chipText.replace(/^Session ID:\s*/, '')
}

// Helper: create a session WITH timer enabled and 1-minute default
async function hostGameWithTimer(page, name) {
  await page.goto('/host')
  await page.getByLabel('Your Name').fill(name)
  // Pick 1m preset from the Round timer segmented control
  await page.getByRole('button', { name: '1m', exact: true }).click()
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page).toHaveURL('/game')
  // Wait for game page to fully load
  await expect(page.getByText('Cast your estimate')).toBeVisible()
  // Session ID chip is the one matching "Session ID: xxxxxxxx"
  const sessionChip = page.locator('.MuiChip-label').filter({ hasText: /^Session ID:/ })
  const chipText = await sessionChip.textContent()
  return chipText.replace(/^Session ID:\s*/, '')
}

// Helper: join a session
async function joinGame(page, name, sessionId) {
  await page.goto('/join')
  await page.getByLabel('Your Name').fill(name)
  await page.getByLabel('Session ID').fill(sessionId)
  await page.getByRole('button', { name: 'Join Game' }).click()
  await expect(page).toHaveURL('/game')
}

// Wait for WebSocket to be ready by polling /refresh until host appears in users list
async function waitForWsReady(page, sessionId, hostName) {
  const maxAttempts = 15
  for (let i = 0; i < maxAttempts; i++) {
    await page.request.get(`http://localhost:3000/refresh?sessionId=${sessionId}`)
    await page.waitForTimeout(1000)
    const visible = await page.locator('p', { hasText: hostName }).isVisible()
    if (visible) {
      await page.waitForTimeout(500)
      return
    }
  }
  throw new Error(
    `WebSocket not ready: "${hostName}" did not appear in users list after ${maxAttempts} retries`,
  )
}

test.describe('Timer Feature', () => {
  test('backwards compat: no timer chip when timer not enabled', async ({ page }) => {
    await hostGame(page, 'Alice')
    // No "Start timer" button should be visible
    await expect(page.getByRole('button', { name: /start timer/i })).toHaveCount(0)
    // No timer chip icon button visible
    await expect(page.getByRole('button', { name: /pause timer/i })).toHaveCount(0)
  })

  test('timer toggle visible on CreateGame; chip shows in Vote view after enabling', async ({
    page,
  }) => {
    await page.goto('/host')
    await page.getByLabel('Your Name').fill('Alice')

    // Round timer segmented control should be visible with an "Off" option
    await expect(page.getByText('Round timer')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Off', exact: true })).toBeVisible()

    // Pick the 1m preset
    await page.getByRole('button', { name: '1m', exact: true }).click()

    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page).toHaveURL('/game')
    await expect(page.getByText('Cast your estimate')).toBeVisible()

    // Timer chip should be visible with "Timer 01:00"
    await expect(
      page
        .locator('.MuiChip-root')
        .filter({ hasText: /Timer 01:00/ })
        .first(),
    ).toBeVisible({ timeout: 5000 })

    // Start button should be visible for the host
    await expect(page.getByRole('button', { name: /start timer/i })).toBeVisible()
  })

  test('host can start timer and countdown decrements', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const joinerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGameWithTimer(hostPage, 'Alice')

      const joinerPage = await joinerCtx.newPage()
      await joinGame(joinerPage, 'Bob', sessionId)
      await waitForWsReady(joinerPage, sessionId, 'Alice')

      // Confirm timer chip is visible before starting
      await expect(
        hostPage
          .locator('.MuiChip-root')
          .filter({ hasText: /Timer 01:00/ })
          .first(),
      ).toBeVisible({ timeout: 5000 })

      // Host clicks Start timer
      await hostPage.getByRole('button', { name: /start timer/i }).click()

      // After start, pause button should appear (confirms running state)
      await expect(hostPage.getByRole('button', { name: /pause timer/i })).toBeVisible({
        timeout: 5000,
      })

      // Wait ~2s then check countdown has moved
      await hostPage.waitForTimeout(2000)
      const countdownChip = hostPage
        .locator('.MuiChip-root')
        .filter({ hasText: /^\d{2}:\d{2}$/ })
        .first()
      const countdownText = await countdownChip.textContent()
      expect(countdownText).not.toBe('01:00')

      // Joiner should also see a countdown chip (timer enabled = true from server)
      await expect
        .poll(
          async () => {
            return joinerPage
              .locator('.MuiChip-root')
              .filter({ hasText: /\d{2}:\d{2}/ })
              .first()
              .isVisible()
          },
          { timeout: 10000 },
        )
        .toBe(true)
    } finally {
      await hostCtx.close()
      await joinerCtx.close()
    }
  })

  test('host can pause timer and countdown freezes', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const joinerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGameWithTimer(hostPage, 'Alice')

      const joinerPage = await joinerCtx.newPage()
      await joinGame(joinerPage, 'Bob', sessionId)
      await waitForWsReady(joinerPage, sessionId, 'Alice')

      // Start timer
      await hostPage.getByRole('button', { name: /start timer/i }).click()
      await hostPage.waitForTimeout(1500)

      // Pause
      await hostPage.getByRole('button', { name: /pause timer/i }).click()

      // Wait for "paused" chip to appear
      const pausedChip = hostPage
        .locator('.MuiChip-root')
        .filter({ hasText: /paused/ })
        .first()
      await expect(pausedChip).toBeVisible({ timeout: 5000 })

      // Value should remain stable for 1.5s (not decrementing)
      const val1 = await pausedChip.textContent()
      await hostPage.waitForTimeout(1500)
      const val2 = await pausedChip.textContent()
      expect(val1).toBe(val2)
    } finally {
      await hostCtx.close()
      await joinerCtx.close()
    }
  })

  test('host can reset timer and it returns to initial duration', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const joinerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGameWithTimer(hostPage, 'Alice')

      const joinerPage = await joinerCtx.newPage()
      await joinGame(joinerPage, 'Bob', sessionId)
      await waitForWsReady(joinerPage, sessionId, 'Alice')

      // Start then wait a bit
      await hostPage.getByRole('button', { name: /start timer/i }).click()
      await hostPage.waitForTimeout(2000)

      // Reset (first reset button that appears while running)
      await hostPage
        .getByRole('button', { name: /reset timer/i })
        .first()
        .click()

      // Both pages should show "Timer 01:00" again
      await expect(
        hostPage
          .locator('.MuiChip-root')
          .filter({ hasText: /Timer 01:00/ })
          .first(),
      ).toBeVisible({ timeout: 5000 })
      await expect(
        joinerPage
          .locator('.MuiChip-root')
          .filter({ hasText: /Timer 01:00/ })
          .first(),
      ).toBeVisible({ timeout: 10000 })

      // Start button should reappear on host
      await expect(hostPage.getByRole('button', { name: /start timer/i })).toBeVisible({
        timeout: 5000,
      })
    } finally {
      await hostCtx.close()
      await joinerCtx.close()
    }
  })

  test('Next Item resets timer back to idle', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const joinerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGameWithTimer(hostPage, 'Alice')

      const joinerPage = await joinerCtx.newPage()
      await joinGame(joinerPage, 'Bob', sessionId)
      await waitForWsReady(joinerPage, sessionId, 'Alice')

      // Start timer
      await hostPage.getByRole('button', { name: /start timer/i }).click()
      await hostPage.waitForTimeout(2000)

      // Both vote to trigger Results view
      await hostPage.getByRole('button', { name: /Vote 5/i }).click()
      await joinerPage.getByRole('button', { name: /Vote 5/i }).click()

      // Wait for results to appear
      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 10000 })

      // Host clicks Next Item
      await hostPage.getByRole('button', { name: 'Next Item' }).click()

      // Wait for Vote view to return (voted → false transition)
      await expect(hostPage.getByText('Cast your estimate')).toBeVisible({ timeout: 15000 })

      // Vote view returns; timer chip should be back to "Timer 01:00"
      await expect(
        hostPage
          .locator('.MuiChip-root')
          .filter({ hasText: /Timer 01:00/ })
          .first(),
      ).toBeVisible({ timeout: 10000 })

      // Start button should reappear
      await expect(hostPage.getByRole('button', { name: /start timer/i })).toBeVisible({
        timeout: 5000,
      })
    } finally {
      await hostCtx.close()
      await joinerCtx.close()
    }
  })
})
