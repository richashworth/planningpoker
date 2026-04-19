import { test, expect } from '@playwright/test'

async function hostGame(page, name) {
  await page.goto('/host')
  await page.getByLabel('Your Name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page).toHaveURL('/game')
  const chipText = await page.locator('.MuiChip-label').textContent()
  return chipText.replace(/^Session ID:\s*/, '')
}

async function joinGame(page, name, sessionId) {
  await page.goto('/join')
  await page.getByLabel('Your Name').fill(name)
  await page.getByLabel('Session ID').fill(sessionId)
  await page.getByRole('button', { name: 'Join Game' }).click()
  await expect(page).toHaveURL('/game')
}

test.describe('Epoch-based messaging — race conditions', () => {
  test('round transitions are clean across multiple iterations', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    for (let i = 0; i < 3; i++) {
      const hostVote = i % 2 === 0 ? '5' : '8'
      const playerVote = i % 2 === 0 ? '3' : '5'

      await hostPage.getByText(hostVote, { exact: true }).click()
      await playerPage.getByText(playerVote, { exact: true }).click()

      await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
      await expect(playerPage.getByText('Results')).toBeVisible({ timeout: 15000 })

      await hostPage.getByRole('button', { name: 'Next Item' }).click()
      await expect(hostPage.getByText('Cast your estimate')).toBeVisible({ timeout: 10000 })
      await expect(playerPage.getByText('Cast your estimate')).toBeVisible({ timeout: 10000 })
    }

    await hostCtx.close()
    await playerCtx.close()
  })

  test('non-host vote after host reset registers at the new round', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    await hostPage.getByText('3', { exact: true }).click()
    await playerPage.getByText('3', { exact: true }).click()
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
    await expect(playerPage.getByText('Results')).toBeVisible({ timeout: 15000 })

    await hostPage.getByRole('button', { name: 'Next Item' }).click()
    await expect(playerPage.getByText('Cast your estimate')).toBeVisible({ timeout: 10000 })
    await expect(hostPage.getByText('Cast your estimate')).toBeVisible({ timeout: 10000 })

    await playerPage.getByText('8', { exact: true }).click()
    await hostPage.getByText('8', { exact: true }).click()
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
    await expect(playerPage.getByText('Results')).toBeVisible({ timeout: 15000 })

    await hostCtx.close()
    await playerCtx.close()
  })

  test('leaver with vote is removed from chart without round bump', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const hostPage = await hostCtx.newPage()
    const sessionId = await hostGame(hostPage, 'Alice')

    const playerCtx = await browser.newContext()
    const playerPage = await playerCtx.newPage()
    await joinGame(playerPage, 'Bob', sessionId)

    await hostPage.getByText('5', { exact: true }).click()
    await playerPage.getByText('8', { exact: true }).click()

    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 })
    await expect(playerPage.getByText('Results')).toBeVisible({ timeout: 15000 })

    await playerPage.getByRole('button', { name: /Bob/i }).click()
    await playerPage.getByRole('menuitem', { name: 'Log out' }).click()
    await expect(playerPage).toHaveURL('/')

    // Host remains in Results view — Bob is gone but Alice's vote persists.
    await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 5000 })
    await expect(hostPage.getByText('Cast your estimate')).not.toBeVisible()

    await hostCtx.close()
    await playerCtx.close()
  })
})
