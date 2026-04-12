import { test, expect } from '@playwright/test'

// Helper to create a session and return the session ID
async function hostGame(page, name) {
  await page.goto('/host')
  await page.getByLabel('Your Name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page).toHaveURL('/game')
  const chipText = await page.locator('.MuiChip-label').textContent()
  return chipText.replace(/^Session ID:\s*/, '')
}

// Helper to join a session
async function joinGame(page, name, sessionId) {
  await page.goto('/join')
  await page.getByLabel('Your Name').fill(name)
  await page.getByLabel('Session ID').fill(sessionId)
  await page.getByRole('button', { name: 'Join Game' }).click()
  await expect(page).toHaveURL('/game')
}

// Wait for a page's WebSocket STOMP subscription to be active.
// hostName is the session host's name — it appears in the non-host player's
// UsersTable only after USERS_MESSAGE is received via WebSocket.
// (The current user's own name comes from Redux state and is always present.)
//
// Strategy: actively poll by calling /refresh (which sends a single
// USERS_MESSAGE + RESULTS_MESSAGE) until hostName appears in the users list.
// This handles cases where STOMP connects after the initial join burst window.
async function waitForWsReady(page, sessionId, hostName) {
  const maxAttempts = 15
  for (let i = 0; i < maxAttempts; i++) {
    // Trigger a fresh burst so the page receives USERS_MESSAGE even if it
    // connected after the initial join burst expired.
    await page.request.get(`http://localhost:3000/refresh?sessionId=${sessionId}`)
    await page.waitForTimeout(1000)
    const visible = await page.locator('p', { hasText: hostName }).isVisible()
    if (visible) {
      // Allow STOMP SUBSCRIBE frames for all topics to be processed server-side
      await page.waitForTimeout(500)
      return
    }
  }
  throw new Error(
    `WebSocket not ready: "${hostName}" did not appear in users list after ${maxAttempts} retries`,
  )
}

test.describe('Session Labels', () => {
  test('host sees label input, non-host sees label via WebSocket', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Host has a label text field
      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      await expect(labelInput).toBeVisible()

      // Non-host should NOT have a label input
      await expect(
        playerPage.getByPlaceholder('Round label (optional)'),
      ).not.toBeVisible()

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Host types a label and clicks Set to broadcast
      await labelInput.fill('Login page redesign')
      await hostPage.getByRole('button', { name: 'Set round label' }).click()

      // Non-host should see the label appear via WebSocket (italic text)
      await expect(playerPage.getByText('Login page redesign')).toBeVisible({
        timeout: 15000,
      })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('label displays on results screen after voting', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Host sets a label then both vote
      await hostPage.getByPlaceholder('Round label (optional)').fill('Sprint 42')
      await hostPage.getByRole('button', { name: 'Set round label' }).click()

      // Wait for label to broadcast before voting
      await expect(playerPage.getByText('Sprint 42')).toBeVisible({
        timeout: 15000,
      })

      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('8', { exact: true }).click()

      // Both should see results with label
      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
      await expect(hostPage.getByText('Sprint 42')).toBeVisible()
      await expect(playerPage.getByText('Sprint 42')).toBeVisible({
        timeout: 15000,
      })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('label clears on next round', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Host sets label and both vote
      await hostPage.getByPlaceholder('Round label (optional)').fill('Item A')
      await hostPage.getByRole('button', { name: 'Set round label' }).click()
      await expect(playerPage.getByText('Item A')).toBeVisible({ timeout: 15000 })

      await hostPage.getByText('3', { exact: true }).click()
      await playerPage.getByText('5', { exact: true }).click()

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      // Host clicks Next Item
      await hostPage.getByRole('button', { name: 'Next Item' }).click()

      // Should be back to voting, label input should be empty
      await expect(hostPage.getByText('Cast your estimate')).toBeVisible({
        timeout: 15000,
      })
      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      await expect(labelInput).toHaveValue('')
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('Set button explicitly broadcasts label to non-host', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      const setBtn = hostPage.getByRole('button', { name: 'Set round label' })

      // Host types without clicking Set — non-host should NOT see it yet
      await labelInput.fill('Deliberate')

      // Short wait to confirm it hasn't broadcast
      await playerPage.waitForTimeout(1000)
      await expect(playerPage.getByText('Deliberate')).not.toBeVisible()

      // Host clicks Set — non-host should now see the label
      await setBtn.click()
      await expect(playerPage.getByText('Deliberate')).toBeVisible({
        timeout: 15000,
      })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('Enter key in label input broadcasts label', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      const labelInput = hostPage.getByPlaceholder('Round label (optional)')

      // Host types and presses Enter to submit
      await labelInput.fill('Via Enter')
      await labelInput.press('Enter')

      // Non-host should see the label via WebSocket
      await expect(playerPage.getByText('Via Enter')).toBeVisible({
        timeout: 15000,
      })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('Empty Set submission clears the broadcast label', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      const setBtn = hostPage.getByRole('button', { name: 'Set round label' })

      // Host sets a label
      await labelInput.fill('Something')
      await setBtn.click()
      await expect(playerPage.getByText('Something')).toBeVisible({
        timeout: 15000,
      })

      // Host clears input and clicks Set — non-host should no longer see label
      await labelInput.fill('')
      await setBtn.click()
      await expect(playerPage.getByText('Something')).not.toBeVisible({
        timeout: 10000,
      })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('Set button is disabled when input matches last broadcast', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      await hostGame(hostPage, 'Alice')

      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      const setBtn = hostPage.getByRole('button', { name: 'Set round label' })

      // Set button starts disabled (input matches empty initial value)
      await expect(setBtn).toBeDisabled()

      // Host types 'A' — button should enable
      await labelInput.fill('A')
      await expect(setBtn).toBeEnabled()

      // Click Set — button should disable again (input matches last broadcast)
      await setBtn.click()
      await expect(setBtn).toBeDisabled()
    } finally {
      await hostCtx.close()
    }
  })
})

test.describe('Consensus', () => {
  test('consensus chip displays after voting', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Both vote the same value
      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('5', { exact: true }).click()

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      // Consensus should show "Consensus: 5" — host sees Select, player sees text
      await expect(hostPage.getByText('Consensus: 5')).toBeVisible()
      await expect(playerPage.getByText('Consensus: 5')).toBeVisible({
        timeout: 15000,
      })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('host can override consensus via dropdown', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Vote different values — Alice:5, Bob:8
      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('8', { exact: true }).click()

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      // Host opens consensus dropdown and picks a different value
      const select = hostPage.locator('.MuiSelect-select')
      await select.click()
      await hostPage.getByRole('option', { name: 'Consensus: 8' }).click()

      // Combobox should display the overridden value
      await expect(hostPage.getByRole('combobox')).toHaveText('Consensus: 8')
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })
})

test.describe('CSV Export', () => {
  test('export CSV button enabled on first round with results', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Both vote
      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('5', { exact: true }).click()

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      // Export CSV button should be enabled even on first round
      const exportBtn = hostPage.getByRole('button', { name: 'Export CSV' })
      await expect(exportBtn).toBeVisible()
      await expect(exportBtn).toBeEnabled()
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('CSV download triggers with correct filename', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Set label, vote, complete round
      await hostPage.getByPlaceholder('Round label (optional)').fill('Story 1')
      await hostPage.getByRole('button', { name: 'Set round label' }).click()
      await expect(playerPage.getByText('Story 1')).toBeVisible({
        timeout: 15000,
      })

      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('8', { exact: true }).click()
      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      await hostPage.getByRole('button', { name: 'Next Item' }).click()
      await expect(hostPage.getByText('Cast your estimate')).toBeVisible({
        timeout: 10000,
      })

      // Vote again to see export button
      await hostPage.getByText('3', { exact: true }).click()
      await playerPage.getByText('3', { exact: true }).click()
      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      // Intercept download
      const [download] = await Promise.all([
        hostPage.waitForEvent('download'),
        hostPage.getByRole('button', { name: 'Export CSV' }).click(),
      ])

      expect(download.suggestedFilename()).toMatch(
        /^planning-poker-[a-f0-9]+\.csv$/,
      )

      // Verify CSV content
      const content = await download.path().then((p) => {
        // eslint-disable-next-line no-undef
        const fs = require('fs')
        return fs.readFileSync(p, 'utf-8')
      })
      expect(content).toContain('Label')
      expect(content).toContain('Consensus')
      expect(content).toContain('Story 1')
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })
})

test.describe('Accessibility announcements', () => {
  test('aria-live polite region is mounted on game pane', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      await hostGame(hostPage, 'Alice')

      const liveRegion = hostPage.locator('[role="status"][aria-live="polite"]')
      await expect(liveRegion).toHaveCount(1)
      await expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    } finally {
      await hostCtx.close()
    }
  })

  test('reveal announcement appears in live region after voting', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Both vote — triggers reveal
      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('8', { exact: true }).click()

      // Live region should contain reveal announcement before the 1500ms consensus debounce fires
      const liveRegion = hostPage.locator('[role="status"][aria-live="polite"]')
      await expect(liveRegion).toContainText(/Votes revealed: \d+ of \d+ players voted/, {
        timeout: 15000,
      })

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('no /setLabel network request fires while typing — only on Set', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      await hostGame(hostPage, 'Alice')

      // Record every POST to /setLabel
      const setLabelRequests = []
      hostPage.on('request', (req) => {
        if (req.method() === 'POST' && req.url().includes('/setLabel')) {
          setLabelRequests.push(req.url())
        }
      })

      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      await expect(labelInput).toBeVisible()

      // Type 20 characters one at a time — if legacy debounce logic were still
      // around, it would fire /setLabel after each 300ms quiet window.
      await labelInput.pressSequentially('Login page redesign!', { delay: 80 })

      // Wait well past any plausible debounce window
      await hostPage.waitForTimeout(2000)

      // STRICT: zero broadcasts during pure typing
      expect(
        setLabelRequests.length,
        `Expected 0 /setLabel POSTs during typing, got ${setLabelRequests.length}`,
      ).toBe(0)

      // Now explicitly click Set — exactly one POST should fire
      await hostPage.getByRole('button', { name: 'Set round label' }).click()
      await hostPage.waitForTimeout(500)
      expect(setLabelRequests.length).toBe(1)
    } finally {
      await hostCtx.close()
    }
  })

  test('live region appears in accessibility tree with correct role and live-ness', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Trigger reveal + consensus
      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('5', { exact: true }).click()

      // Wait for announcement text to populate
      const liveRegion = hostPage.locator('[role="status"][aria-live="polite"]')
      await expect(liveRegion).toContainText(/Votes revealed/, { timeout: 15000 })

      // Snapshot the accessibility tree via getByRole — the ARIA contract is
      // what screen readers actually consume. If role="status" isn't exposed
      // on a node carrying the announcement text, VoiceOver/NVDA won't fire.
      const statusByRole = hostPage.getByRole('status')
      await expect(statusByRole).toHaveCount(1)
      await expect(statusByRole).toContainText(/Votes revealed/)

      // Belt-and-braces: aria-snapshot yaml should include the status role
      // with the reveal text attached, matching what an AT would traverse.
      const ariaSnapshot = await statusByRole.ariaSnapshot()
      expect(ariaSnapshot).toMatch(/status/)
      expect(ariaSnapshot).toMatch(/Votes revealed/)
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('consensus announcement appears in live region after reveal', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Both vote the same value to trigger consensus
      await hostPage.getByText('5', { exact: true }).click()
      await playerPage.getByText('5', { exact: true }).click()

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
      await expect(hostPage.getByText('Consensus: 5')).toBeVisible({ timeout: 10000 })

      // Live region should contain consensus announcement (fires after 1500ms debounce)
      const liveRegion = hostPage.locator('[role="status"][aria-live="polite"]')
      await expect(liveRegion).toContainText(/Consensus: /, { timeout: 15000 })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })
})
