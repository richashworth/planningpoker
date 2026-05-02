#!/usr/bin/env node
// Records a Planning Poker demo: host + 9 players, two rounds of voting.
// Produces docs/demo.webm and docs/demo.gif (requires ffmpeg on PATH).
//
// Usage:
//   node scripts/record-demo.mjs                 # target live app
//   APP_URL=http://localhost:3000 node scripts/record-demo.mjs
//
// Run from repo root. Playwright is installed under planningpoker-web/node_modules.

import { chromium } from '/Users/richard/Projects/planningpoker/planningpoker-web/node_modules/@playwright/test/index.mjs';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const APP_URL = process.env.APP_URL || 'https://planning-poker.up.railway.app';
const DOCS = join(REPO, 'docs');
const VIDEO_DIR = join(DOCS, '_video');
const WEBM_OUT = join(DOCS, 'demo.webm');
const GIF_OUT = join(DOCS, 'demo.gif');

const VIEWPORT = { width: 1280, height: 800 };
const HOST_NAME = 'Alice';
const PLAYERS = ['Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];

// Fibonacci votes per round. Each round has:
//  - a clear mode (auto-consensus)
//  - a strong runner-up (so the override interaction reads as a real choice)
//  - one outlier on the long side
// Round 1: mode=5 (5 votes), runner-up=3 (4 votes), outlier=13. Right-skewed.
// Round 2: mode=8 (5 votes), runner-up=5 (4 votes), outlier=1.  Left-skewed.
const ROUND_1 = { Alice: '5', Bob: '3', Carol: '5', Dave: '3', Eve: '5', Frank: '5', Grace: '3', Henry: '5', Iris: '3', Jack: '13' };
const ROUND_2 = { Alice: '8', Bob: '5', Carol: '8', Dave: '5', Eve: '8', Frank: '1', Grace: '8', Henry: '5', Iris: '5', Jack: '8' };

// On the Round 2 results screen, the host overrides the auto-consensus to the
// runner-up card to demonstrate the consensus-override feature.
const ROUND_2_OVERRIDE = '5';

// The single off-shape voter per round. We force these to vote first among
// the players so the outlier shows up early in the histogram.
const ROUND_1_OUTLIER = 'Jack'; // votes 13 in a 3/5-clustered round
const ROUND_2_OUTLIER = 'Frank'; // votes 1 in a 5/8-clustered round

// Item labels (descriptions) the host types before each vote.
const ROUND_1_LABEL = 'AUTH-142 — OAuth login with Google';
const ROUND_2_LABEL = 'AUTH-143 — Password reset via email';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (min, max) => min + Math.floor(Math.random() * (max - min));

// Vote order with per-player pause BEFORE their vote, so the histogram grows
// organically (some players decide quickly, others take a moment). When an
// `outlier` name is supplied it is forced to vote FIRST among the players, so
// viewers see the off-shape estimate land early and watch the rest of the
// distribution coalesce around the eventual consensus.
function buildVoteOrder(names, outlier) {
  const ordered = outlier
    ? [outlier, ...names.filter((n) => n !== outlier)]
    : [...names];
  return ordered.map((name, i) => ({
    name,
    // Most people 250-550ms, every ~4th player a longer "thinking" pause.
    delay: i % 4 === 3 ? jitter(950, 1300) : jitter(250, 550),
  }));
}

// Poll until the consensus-rail badges sum to the expected total, so the
// host's view has caught up to every websocket vote message before we drive
// any further interaction (e.g. the override click).
async function waitForAllVotesIn(hostPage, expectedTotal) {
  await hostPage.waitForFunction(
    (expected) => {
      const buttons = document.querySelectorAll('button[aria-label^="Set consensus to"]');
      let total = 0;
      for (const b of buttons) {
        const m = b.getAttribute('aria-label').match(/\((\d+) votes?\)/);
        if (m) total += parseInt(m[1], 10);
      }
      return total >= expected;
    },
    expectedTotal,
    { timeout: 10000 },
  );
}

async function hostGame(page) {
  await page.goto(`${APP_URL}/host`);
  await sleep(900); // dwell on the empty host page so viewers can read it
  const nameField = page.getByLabel('Your Name');
  await nameField.click();
  await sleep(250);
  // Animate typing rather than instant fill — the host name is a focal point
  // on the otherwise-static intro screen.
  await nameField.pressSequentially(HOST_NAME, { delay: 90 });
  await sleep(700); // pause on the populated form before submitting
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.waitForURL(/\/game$/);
  await page.getByText('Cast your estimate').waitFor();
  const chipText = await page.locator('.MuiChip-label').textContent();
  return chipText.replace(/^Session ID:\s*/, '');
}

async function joinGame(page, name, sessionId) {
  await page.goto(`${APP_URL}/join`);
  await page.getByLabel('Your Name').fill(name);
  await page.getByLabel('Session ID').fill(sessionId);
  await page.getByRole('button', { name: 'Join Game' }).click();
  await page.waitForURL(/\/game$/);
  await page.getByText('Cast your estimate').waitFor();
}

async function castVote(page, value) {
  // Cards are rendered as clickable text. exact:true avoids "13" matching "1".
  await page.getByText(value, { exact: true }).first().click();
}

// Host opens the CURRENT ITEM banner, types a description, and presses Enter.
// In Option F the banner is click-to-edit: we first click the banner to reveal
// the TextField, then pressSequentially so viewers see the text appear.
async function setRoundLabel(hostPage, label) {
  const field = hostPage.getByPlaceholder('Item label (optional)');
  await field.waitFor({ timeout: 5000 });
  await field.fill('');
  await field.pressSequentially(label, { delay: 40 });
  await sleep(280);
  await hostPage.keyboard.press('Enter');
  await sleep(800); // let "✓ Saved" show before voting begins
}

async function joinPlayersInBatches(browser, playerCtxs, playerPages, sessionId) {
  // Two concurrent batches keep the join sequence visible without dwelling
  // on a half-empty player list. The batches are still small enough that
  // they don't overlap in time, so each group lands as a visible chunk.
  const BATCH_SIZES = [5, 4]; // 9 players total
  let cursor = 0;
  for (const size of BATCH_SIZES) {
    const batch = PLAYERS.slice(cursor, cursor + size);
    cursor += size;
    const results = await Promise.all(
      batch.map(async (name) => {
        const ctx = await browser.newContext({ viewport: VIEWPORT });
        const page = await ctx.newPage();
        await joinGame(page, name, sessionId);
        return { ctx, page, name };
      }),
    );
    for (const r of results) {
      playerCtxs.push(r.ctx);
      playerPages.push({ name: r.name, page: r.page });
    }
    await sleep(500); // brief pause between batches so each group lands visibly
  }
}

async function main() {
  mkdirSync(DOCS, { recursive: true });
  if (existsSync(VIDEO_DIR)) rmSync(VIDEO_DIR, { recursive: true, force: true });
  mkdirSync(VIDEO_DIR, { recursive: true });

  console.log(`→ Launching chromium, target: ${APP_URL}`);
  const browser = await chromium.launch({ headless: true });

  // Host context: records video.
  const hostCtx = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
  });
  const hostPage = await hostCtx.newPage();

  console.log('→ Host creates session...');
  const sessionId = await hostGame(hostPage);
  console.log(`  session ID: ${sessionId}`);
  await sleep(900); // Let viewer see the session chip

  // Players join in two concurrent batches WHILE the host types the round-1
  // label. Overlapping these phases makes the GIF feel like a real session
  // (the host is filling in the prompt while the room fills up) and avoids a
  // dead frame where everyone is just waiting for the host to type.
  console.log('→ Players joining (concurrent with host typing label)...');
  const playerCtxs = [];
  const playerPages = [];
  await Promise.all([
    joinPlayersInBatches(browser, playerCtxs, playerPages, sessionId),
    (async () => {
      await sleep(400); // small head start so the first joiners land first
      await setRoundLabel(hostPage, ROUND_1_LABEL);
    })(),
  ]);
  await sleep(700); // Brief settle before voting begins

  // --- Round 1 ---
  console.log('→ Round 1 voting...');
  // Host decides first (typical in a real session)
  await sleep(jitter(350, 600));
  await castVote(hostPage, ROUND_1[HOST_NAME]);
  // Outlier votes first so the off-shape estimate appears early in the chart.
  const order1 = buildVoteOrder(PLAYERS, ROUND_1_OUTLIER);
  const byName1 = Object.fromEntries(playerPages.map((p) => [p.name, p.page]));
  for (const { name, delay } of order1) {
    await sleep(delay);
    await castVote(byName1[name], ROUND_1[name]);
  }
  // Host reveal screen — wait for the host-only "Next Item" CTA which only
  // appears once the host has voted, then wait for every vote to propagate.
  await hostPage.getByRole('button', { name: 'Next Item' }).waitFor({ timeout: 15000 });
  await waitForAllVotesIn(hostPage, PLAYERS.length + 1);
  await sleep(3000); // Dwell on results chart

  console.log('→ Host clicks Next Item...');
  await hostPage.getByRole('button', { name: 'Next Item' }).click();
  await hostPage.getByText('Cast your estimate').waitFor({ timeout: 10000 });
  await sleep(900);

  // --- Round 2 ---
  console.log('→ Round 2: host sets description, then voting...');
  await setRoundLabel(hostPage, ROUND_2_LABEL);
  await sleep(450);
  await sleep(jitter(350, 600));
  await castVote(hostPage, ROUND_2[HOST_NAME]);
  // Shuffle the rest of the players so round 2 feels distinct, but keep the
  // outlier first so the asymmetric distribution forms early.
  const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5);
  const order2 = buildVoteOrder(shuffled, ROUND_2_OUTLIER);
  for (const { name, delay } of order2) {
    await sleep(delay);
    await castVote(byName1[name], ROUND_2[name]);
  }
  // Wait for every websocket vote message to land before driving the
  // consensus-override click — viewers should see the full distribution
  // settle, then the host pick the runner-up.
  await hostPage.getByRole('button', { name: 'Next Item' }).waitFor({ timeout: 15000 });
  await waitForAllVotesIn(hostPage, PLAYERS.length + 1);
  await sleep(2200); // Read the auto-consensus before overriding

  // Demonstrate the consensus override: host clicks the runner-up card in the
  // "Set consensus" rail, locking that value in instead of the auto-mode. The
  // chart highlight and rail selection both shift to confirm the change.
  console.log(`→ Host overrides consensus to ${ROUND_2_OVERRIDE}...`);
  await hostPage
    .getByRole('button', { name: new RegExp(`^Set consensus to ${ROUND_2_OVERRIDE}\\b`) })
    .click();
  await sleep(3200); // Final dwell on overridden consensus

  console.log('→ Closing contexts...');
  // Close players first, then the host (host close flushes the video)
  for (const ctx of playerCtxs) await ctx.close();
  await hostCtx.close();
  await browser.close();

  // Find the recorded webm and move it to docs/demo.webm
  const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) {
    console.error('✗ No video file produced.');
    process.exit(1);
  }
  const src = join(VIDEO_DIR, files[0]);
  if (existsSync(WEBM_OUT)) rmSync(WEBM_OUT);
  renameSync(src, WEBM_OUT);
  rmSync(VIDEO_DIR, { recursive: true, force: true });
  const webmSize = (statSync(WEBM_OUT).size / 1024).toFixed(0);
  console.log(`✓ Video: ${WEBM_OUT} (${webmSize} KB)`);

  // Convert to GIF with palette for quality.
  console.log('→ Converting to GIF (ffmpeg)...');
  const palette = join(DOCS, '_palette.png');
  const filters = 'fps=15,scale=1280:-1:flags=lanczos';
  execSync(
    `ffmpeg -y -i "${WEBM_OUT}" -vf "${filters},palettegen=stats_mode=diff" "${palette}"`,
    { stdio: 'inherit' },
  );
  execSync(
    `ffmpeg -y -i "${WEBM_OUT}" -i "${palette}" -lavfi "${filters} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" "${GIF_OUT}"`,
    { stdio: 'inherit' },
  );
  rmSync(palette, { force: true });
  const gifSize = (statSync(GIF_OUT).size / 1024).toFixed(0);
  console.log(`✓ GIF: ${GIF_OUT} (${gifSize} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
