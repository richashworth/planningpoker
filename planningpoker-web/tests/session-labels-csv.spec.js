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

test.describe('Session Labels', () => {
  test('host sees label input, non-host sees label via WebSocket', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    // Host has a label text field
    const labelInput = hostPage.getByPlaceholder('Round label (optional)')
    await expect(labelInput).toBeVisible()

    // Non-host should NOT have a label input
    await expect(
      playerPage.getByPlaceholder('Round label (optional)'),
    ).not.toBeVisible()

    // Host types a label
    await labelInput.fill('Login page redesign')

    // Non-host should see the label appear via WebSocket (italic text)
    await expect(playerPage.getByText('Login page redesign')).toBeVisible({
      timeout: 10000,
    })

    await hostCtx.close()
    await playerCtx.close()
  })

  test('label displays on results screen after voting', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    // Host sets a label then both vote
    await hostPage.getByPlaceholder('Round label (optional)').fill('Sprint 42')

    // Wait for label to broadcast before voting
    await expect(playerPage.getByText('Sprint 42')).toBeVisible({
      timeout: 10000,
    })

    await hostPage.getByText('5', { exact: true }).click()
    await playerPage.getByText('8', { exact: true }).click()

    // Both should see results with label
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
    await expect(hostPage.getByText('Sprint 42')).toBeVisible()
    await expect(playerPage.getByText('Sprint 42')).toBeVisible({
      timeout: 15000,
    })

    await hostCtx.close()
    await playerCtx.close()
  })

  test('label clears on next round', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    // Host sets label and both vote
    await hostPage.getByPlaceholder('Round label (optional)').fill('Item A')
    await expect(playerPage.getByText('Item A')).toBeVisible({ timeout: 10000 })

    await hostPage.getByText('3', { exact: true }).click()
    await playerPage.getByText('5', { exact: true }).click()

    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

    // Host clicks Next Item
    await hostPage.getByRole('button', { name: 'Next Item' }).click()

    // Should be back to voting, label input should be empty
    await expect(hostPage.getByText('Cast your estimate')).toBeVisible({
      timeout: 10000,
    })
    const labelInput = hostPage.getByPlaceholder('Round label (optional)')
    await expect(labelInput).toHaveValue('')

    await hostCtx.close()
    await playerCtx.close()
  })
})

test.describe('Consensus', () => {
  test('consensus chip displays after voting', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    // Both vote the same value
    await hostPage.getByText('5', { exact: true }).click()
    await playerPage.getByText('5', { exact: true }).click()

    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

    // Consensus chip should show "Consensus: 5"
    await expect(hostPage.getByText('Consensus: 5')).toBeVisible()
    await expect(playerPage.getByText('Consensus: 5')).toBeVisible({
      timeout: 15000,
    })

    await hostCtx.close()
    await playerCtx.close()
  })

  test('host can override consensus via dropdown', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    // Vote different values — Alice:5, Bob:8
    await hostPage.getByText('5', { exact: true }).click()
    await playerPage.getByText('8', { exact: true }).click()

    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })

    // Host clicks the consensus chip to open override dropdown
    const chip = hostPage.locator('.MuiChip-root', { hasText: 'Consensus:' })
    await chip.click()

    // Override dropdown should appear — select a different value
    const select = hostPage.locator('.MuiSelect-select')
    await select.click()
    await hostPage.getByRole('option', { name: '8' }).click()

    // Chip should now show overridden value
    await expect(
      hostPage.locator('.MuiChip-root', { hasText: 'Consensus: 8' }),
    ).toBeVisible()

    await hostCtx.close()
    await playerCtx.close()
  })
})

test.describe('CSV Export', () => {
  test('export CSV button enabled on first round with results', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
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

    await hostCtx.close()
    await playerCtx.close()
  })

  test('CSV download triggers with correct filename', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    // Set label, vote, complete round
    await hostPage.getByPlaceholder('Round label (optional)').fill('Story 1')
    await expect(playerPage.getByText('Story 1')).toBeVisible({
      timeout: 10000,
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
      const fs = require('fs')
      return fs.readFileSync(p, 'utf-8')
    })
    expect(content).toContain('Label')
    expect(content).toContain('Consensus')
    expect(content).toContain('Story 1')

    await hostCtx.close()
    await playerCtx.close()
  })
})
