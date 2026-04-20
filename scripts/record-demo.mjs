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

// Fibonacci votes per round. Clear consensus with an obvious outlier each round.
// Round 1: 5 is consensus, Jack is the outlier at 13.
// Round 2: 8 is consensus, Carol is the outlier at 21... wait, not in Fibonacci default.
const ROUND_1 = { Alice: '5', Bob: '5', Carol: '5', Dave: '3', Eve: '5', Frank: '5', Grace: '5', Henry: '5', Iris: '8', Jack: '13' };
const ROUND_2 = { Alice: '8', Bob: '8', Carol: '13', Dave: '8', Eve: '8', Frank: '8', Grace: '8', Henry: '5', Iris: '8', Jack: '8' };

// Item labels (descriptions) the host types before each vote.
const ROUND_1_LABEL = 'AUTH-142 — OAuth login with Google';
const ROUND_2_LABEL = 'AUTH-143 — Password reset via email';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (min, max) => min + Math.floor(Math.random() * (max - min));

// Vote order with per-player pause BEFORE their vote, so the histogram grows
// organically (some players decide quickly, others take a moment).
function buildVoteOrder(names) {
  return names.map((name, i) => ({
    name,
    // Most people 300-900ms, every ~3rd player a longer "thinking" pause.
    delay: i % 3 === 2 ? jitter(1400, 2200) : jitter(300, 900),
  }));
}

async function hostGame(page) {
  await page.goto(`${APP_URL}/host`);
  await sleep(800);
  await page.getByLabel('Your Name').fill(HOST_NAME);
  await sleep(500);
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
  await field.pressSequentially(label, { delay: 45 });
  await sleep(400);
  await hostPage.keyboard.press('Enter');
  await sleep(900); // let "✓ Saved" show before voting begins
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
  await sleep(1200); // Let viewer see the session chip

  // Player contexts join in small batches (2-3 at a time) so the user list
  // grows in visible chunks instead of one row per frame.
  console.log(`→ ${PLAYERS.length} players joining in batches...`);
  const playerCtxs = [];
  const playerPages = [];
  const BATCH_SIZES = [3, 3, 2, 1]; // 9 players total
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
    await sleep(700); // brief pause between batches so each group lands visibly
  }
  await sleep(1200); // Dwell on the full user list

  // --- Round 1 ---
  console.log('→ Round 1: host sets description, then voting...');
  await setRoundLabel(hostPage, ROUND_1_LABEL);
  await sleep(700);
  // Host decides first (typical in a real session)
  await sleep(jitter(500, 900));
  await castVote(hostPage, ROUND_1[HOST_NAME]);
  // Players vote in jittered order with varied thinking time
  const order1 = buildVoteOrder(PLAYERS);
  const byName1 = Object.fromEntries(playerPages.map((p) => [p.name, p.page]));
  for (const { name, delay } of order1) {
    await sleep(delay);
    await castVote(byName1[name], ROUND_1[name]);
  }
  // Host reveal screen
  await hostPage.getByText('Results').waitFor({ timeout: 15000 });
  await sleep(3500); // Dwell on results chart

  console.log('→ Host clicks Next Item...');
  await hostPage.getByRole('button', { name: 'Next Item' }).click();
  await hostPage.getByText('Cast your estimate').waitFor({ timeout: 10000 });
  await sleep(1200);

  // --- Round 2 ---
  console.log('→ Round 2: host sets description, then voting...');
  await setRoundLabel(hostPage, ROUND_2_LABEL);
  await sleep(700);
  await sleep(jitter(500, 900));
  await castVote(hostPage, ROUND_2[HOST_NAME]);
  // Different vote order so round 2 feels distinct
  const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5);
  const order2 = buildVoteOrder(shuffled);
  for (const { name, delay } of order2) {
    await sleep(delay);
    await castVote(byName1[name], ROUND_2[name]);
  }
  await hostPage.getByText('Results').waitFor({ timeout: 15000 });
  await sleep(4000); // Final dwell on results

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
