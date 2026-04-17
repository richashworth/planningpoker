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
  test('host sees label input, non-host sees label via WebSocket', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const playerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const playerPage = await playerCtx.newPage()
      await joinGame(playerPage, 'Bob', sessionId)

      // Host sees the inline label input
      await expect(hostPage.getByPlaceholder('Round label (optional)')).toBeVisible()

      // Non-host should NOT have a label input
      await expect(playerPage.getByPlaceholder('Round label (optional)')).not.toBeVisible()

      // Wait for player WebSocket to deliver USERS_MESSAGE (host name appears in users list)
      await waitForWsReady(playerPage, sessionId, 'Alice')

      // Host types a label and presses Enter to commit
      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      await labelInput.fill('Login page redesign')
      await labelInput.press('Enter')

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

      // Host opens the banner, sets a label and commits with Enter
      const sprintInput = hostPage.getByPlaceholder('Round label (optional)')
      await sprintInput.fill('Sprint 42')
      await sprintInput.press('Enter')

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

      // Host opens banner, sets label and commits with Enter
      const itemAInput = hostPage.getByPlaceholder('Round label (optional)')
      await itemAInput.fill('Item A')
      await itemAInput.press('Enter')
      await expect(playerPage.getByText('Item A')).toBeVisible({ timeout: 15000 })

      await hostPage.getByText('3', { exact: true }).click()
      await playerPage.getByText('5', { exact: true }).click()

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      // Host clicks Next Item
      await hostPage.getByRole('button', { name: 'Next Item' }).click()

      // Should be back to voting, label field should be empty
      await expect(hostPage.getByText('Cast your estimate')).toBeVisible({
        timeout: 15000,
      })
      await expect(hostPage.getByPlaceholder('Round label (optional)')).toHaveValue('')
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })

  test('label broadcasts to non-host on Enter key', async ({ browser }) => {
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

      // Host types — do not yet commit. Non-host should NOT see it within debounce window.
      await labelInput.fill('Deliberate')

      // Commit explicitly with Enter (deterministic, faster than debounce)
      await labelInput.press('Enter')
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

  test('empty label on Enter clears broadcast', async ({ browser }) => {
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

      // Host sets a label
      await labelInput.fill('Something')
      await labelInput.press('Enter')
      await expect(playerPage.getByText('Something')).toBeVisible({
        timeout: 15000,
      })

      // Re-enter edit mode, clear input, press Enter — non-host should no longer see label
      const labelInput2 = hostPage.getByPlaceholder('Round label (optional)')
      await labelInput2.fill('')
      await labelInput2.press('Enter')
      await expect(playerPage.getByText('Something')).not.toBeVisible({
        timeout: 10000,
      })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
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

      // Host sees Consensus label + Select showing the value; non-host sees nothing
      await expect(hostPage.getByText('Consensus:', { exact: true })).toBeVisible()
      await expect(hostPage.getByRole('combobox')).toHaveText('5')
      await expect(playerPage.getByText('Consensus:', { exact: true })).toHaveCount(0)
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
      await hostPage.getByRole('option', { name: '8', exact: true }).click()

      // Combobox should display the overridden value
      await expect(hostPage.getByRole('combobox')).toHaveText('8')
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })
})

test.describe('CSV Export', () => {
  test('export CSV button enabled on first round with results', async ({ browser }) => {
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

      // Set label via banner → Enter commit
      const story1Input = hostPage.getByPlaceholder('Round label (optional)')
      await story1Input.fill('Story 1')
      await story1Input.press('Enter')
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

      // Intercept download (button is below the chart now — scroll it in)
      const exportBtn = hostPage.getByRole('button', { name: 'Export CSV' })
      await exportBtn.scrollIntoViewIfNeeded()
      const [download] = await Promise.all([hostPage.waitForEvent('download'), exportBtn.click()])

      expect(download.suggestedFilename()).toMatch(/^planning-poker-[a-f0-9]+\.csv$/)

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

  test('CSV has no stats columns and includes non-voting players', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const voterCtx = await browser.newContext()
    const lurkerCtx = await browser.newContext()
    try {
      const hostPage = await hostCtx.newPage()
      const sessionId = await hostGame(hostPage, 'Alice')

      const voterPage = await voterCtx.newPage()
      await joinGame(voterPage, 'Bob', sessionId)

      const lurkerPage = await lurkerCtx.newPage()
      await joinGame(lurkerPage, 'Carol', sessionId)

      await waitForWsReady(hostPage, sessionId, 'Carol')

      // Only Alice and Bob vote; Carol does not
      await hostPage.getByText('5', { exact: true }).click()
      await voterPage.getByText('5', { exact: true }).click()
      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      const exportBtn = hostPage.getByRole('button', { name: 'Export CSV' })
      await exportBtn.scrollIntoViewIfNeeded()
      const [download] = await Promise.all([hostPage.waitForEvent('download'), exportBtn.click()])

      const content = await download.path().then((p) => {
        // eslint-disable-next-line no-undef
        const fs = require('fs')
        return fs.readFileSync(p, 'utf-8')
      })

      const [header, dataRow] = content.split('\n')

      // Stats columns removed
      expect(header).not.toMatch(/\bMode\b/)
      expect(header).not.toMatch(/\bMin\b/)
      expect(header).not.toMatch(/\bMax\b/)
      expect(header).not.toMatch(/\bVariance\b/)

      // Header is exactly: Label,Consensus,Timestamp, then sorted players
      expect(header).toBe('Label,Consensus,Timestamp,Alice,Bob,Carol')

      // Data row: empty label, consensus 5, iso timestamp, Alice=5, Bob=5, Carol=(empty)
      // Columns 0..2 = Label/Consensus/Timestamp; 3/4/5 = Alice/Bob/Carol
      const cols = dataRow.split(',')
      expect(cols[0]).toBe('') // no label set
      expect(cols[1]).toBe('5')
      expect(cols[3]).toBe('5') // Alice
      expect(cols[4]).toBe('5') // Bob
      expect(cols[5]).toBe('') // Carol — non-voter, blank
    } finally {
      await hostCtx.close()
      await voterCtx.close()
      await lurkerCtx.close()
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

  test('no /setLabel fires while typing; exactly one fires after debounce settles', async ({
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

      // Enter edit mode via banner
      const labelInput = hostPage.getByPlaceholder('Round label (optional)')
      await expect(labelInput).toBeVisible()

      // Type 'Hello' character-by-character well under the 1000ms debounce window
      await labelInput.pressSequentially('Hello', { delay: 80 })

      // Immediately after typing, no request should have fired yet
      expect(
        setLabelRequests.length,
        `Expected 0 /setLabel POSTs during active typing, got ${setLabelRequests.length}`,
      ).toBe(0)

      // Wait past the 1000ms debounce window
      await hostPage.waitForTimeout(1200)

      // Exactly one debounced broadcast should have fired
      expect(
        setLabelRequests.length,
        `Expected 1 /setLabel POST after debounce settled, got ${setLabelRequests.length}`,
      ).toBe(1)
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
      await expect(hostPage.getByRole('combobox')).toHaveText('5', { timeout: 10000 })

      // Live region should contain consensus announcement (fires after 1500ms debounce)
      const liveRegion = hostPage.locator('[role="status"][aria-live="polite"]')
      await expect(liveRegion).toContainText(/Consensus: /, { timeout: 15000 })
    } finally {
      await hostCtx.close()
      await playerCtx.close()
    }
  })
})
