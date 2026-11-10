#!/usr/bin/env node
// City tour (T-006, FR-019, AC-011): serves the built dist/ folder, opens the game
// with ?tour as a 915x412 landscape touch phone, starts a game, then visits every
// borough through the dossier Turf tab ("Travel Here", in order), teleports to the
// Battery ferry terminal with window.__cityTour.teleport, takes the ferry through the
// HUD prompt and ends on Staten Island. Six 915x412 JPEG screenshots (about 60% quality)
// are saved in ./city-tour-shots/ and printed base64-encoded in the log.
//
// Pinned contract (added by T-005 and T-009, present only with ?tour):
//   window.__cityTour = { teleport(x, y), frameTimeMs() }
//   optional extra numeric fields on the hook, any key matching /slow|chunk|piece/i, are
//   read as the slowest piece draw time; otherwise "n/a" is printed.
//   HUD prompt button with a ferry type whose text contains "ferry" (case-insensitive).
//
// Output: `CITY_SHOT <n> <index> <chunk>` lines (n = 1..6, index = 0-based chunk number,
// chunk = about 4 KB of base64, concatenate chunks in index order to rebuild the JPEG),
// then one `CITY_TOUR_REPORT {json}` line. Exit 0 = clean, 1 = failures, 2 = navigation failed.
//
// Usage: node scripts/city-tour.mjs [distDir]

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const DIST_DIR = path.resolve(process.argv[2] || process.env.DIST_DIR || 'dist');
const SHOTS_DIR = path.resolve('city-tour-shots');
const VIEWPORT = { width: 915, height: 412 };
const JPEG_QUALITY = 60;
const CHUNK_SIZE = 4096;
const STEP_TIMEOUT = 15000;
const EXPECTED_BOROUGH_BUTTONS = 5;

// Battery ferry terminal on a pier cell. Same value as FERRY_TERMINALS.battery in
// src/world/cityData.ts; used only if importing cityData with Node type stripping fails.
const FALLBACK_BATTERY = { x: 1776, y: 3696 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};

/** Tiny static server for dist/ (base `/`), falling back to index.html. */
function startServer(root) {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end('bad request');
      return;
    }
    let filePath = path.normalize(path.join(root, urlPath));
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    try {
      if (fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    } catch {
      filePath = path.join(root, 'index.html');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/** Runs in the page: samples the game canvas on a grid and counts distinct colours. */
function sampleCanvasInPage() {
  const canvases = [...document.querySelectorAll('canvas')].filter((c) => c.width > 0 && c.height > 0);
  if (canvases.length === 0) return { error: 'no canvas', distinct: 0, samples: 0 };
  // The game canvas is the largest one.
  canvases.sort((a, b) => b.width * b.height - a.width * a.height);
  const src = canvases[0];
  const W = 48;
  const H = 30;
  const probe = document.createElement('canvas');
  probe.width = W;
  probe.height = H;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  try {
    ctx.drawImage(src, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    const colours = new Set();
    for (let i = 0; i < data.length; i += 4) {
      // Quantise to 16 levels per channel so tiny dithering does not count as variety.
      colours.add(((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4));
    }
    return { distinct: colours.size, samples: W * H, canvasWidth: src.width, canvasHeight: src.height };
  } catch (e) {
    return { error: String(e && e.message ? e.message : e), distinct: 0, samples: 0 };
  }
}

const report = {
  viewport: { ...VIEWPORT, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  dist: DIST_DIR,
  battery: null,
  shots: [],
  frameTimeMs: { samples: [], average: null },
  slowestChunkDrawMs: 'n/a',
  pageErrors: [],
  blankShots: [],
  notes: [],
  navigationError: null,
  failed: false,
};

async function loadBattery() {
  try {
    const mod = await import(pathToFileURL(path.resolve('src/world/cityData.ts')).href);
    const p = mod.FERRY_TERMINALS && mod.FERRY_TERMINALS.battery;
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: p.x, y: p.y, source: 'cityData.ts' };
    report.notes.push('FERRY_TERMINALS.battery missing in cityData; using hardcoded fallback');
  } catch (e) {
    report.notes.push(`cityData import failed (${String(e && e.message ? e.message : e).split('\n')[0]}); using hardcoded fallback`);
  }
  return { ...FALLBACK_BATTERY, source: 'fallback' };
}

async function step(desc, fn) {
  try {
    await fn();
  } catch (err) {
    const e = new Error(`${desc}: ${err && err.message ? err.message.split('\n')[0] : err}`);
    e.navigation = true;
    throw e;
  }
}

let shotNumber = 0;
async function shoot(page, name) {
  await page.waitForTimeout(600);
  shotNumber += 1;
  const file = `${String(shotNumber).padStart(2, '0')}-${name}.jpg`;
  const buf = await page.screenshot({
    path: path.join(SHOTS_DIR, file),
    type: 'jpeg',
    quality: JPEG_QUALITY,
    fullPage: false,
  });
  const px = await page.evaluate(sampleCanvasInPage);
  const blank = !!px.error || px.distinct < 8;
  if (blank) {
    report.blankShots.push(name);
    report.failed = true;
  }
  const ft = await page.evaluate(() => {
    const h = window.__cityTour;
    return h && typeof h.frameTimeMs === 'function' ? Number(h.frameTimeMs()) : null;
  });
  if (ft !== null && Number.isFinite(ft)) report.frameTimeMs.samples.push(Math.round(ft * 100) / 100);
  report.shots.push({
    n: shotNumber,
    name,
    file,
    bytes: buf.length,
    distinctColours: px.distinct,
    sampled: px.samples,
    canvas: px.canvasWidth ? `${px.canvasWidth}x${px.canvasHeight}` : null,
    blank,
    canvasError: px.error || null,
    frameTimeMs: ft,
  });
  // Base64 JPEG in the log so the controller can rebuild it from `gh run view --log`.
  const b64 = buf.toString('base64');
  let idx = 0;
  for (let i = 0; i < b64.length; i += CHUNK_SIZE) {
    console.log(`CITY_SHOT ${shotNumber} ${idx} ${b64.slice(i, i + CHUNK_SIZE)}`);
    idx += 1;
  }
}

async function readSlowestChunk(page) {
  const found = await page.evaluate(() => {
    const h = window.__cityTour;
    if (!h) return null;
    const out = {};
    for (const k of Object.keys(h)) {
      if (!/slow|chunk|piece/i.test(k)) continue;
      let v = h[k];
      try {
        if (typeof v === 'function') v = v.call(h);
      } catch {
        continue;
      }
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return out;
  });
  if (found && Object.keys(found).length > 0) {
    const key = Object.keys(found).sort()[0];
    report.slowestChunkDrawMs = Math.round(found[key] * 100) / 100;
    report.notes.push(`slowest chunk draw read from window.__cityTour.${key}`);
  }
}

async function main() {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    throw Object.assign(new Error(`no index.html in ${DIST_DIR}; run npm run build first`), { navigation: true });
  }
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const battery = await loadBattery();
  report.battery = battery;

  const server = await startServer(DIST_DIR);
  const baseUrl = `http://127.0.0.1:${server.address().port}/?tour`;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      screen: VIEWPORT,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(STEP_TIMEOUT);
    page.on('pageerror', (err) => report.pageErrors.push(String(err && err.message ? err.message : err).slice(0, 300)));

    await step('title screen', async () => {
      await page.goto(baseUrl, { waitUntil: 'load', timeout: 30000 });
      await page.locator('#don-name-input').waitFor({ state: 'visible' });
      await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
      await page.touchscreen.tap(VIEWPORT.width / 2, 6);
    });

    await step('start game', async () => {
      await page.getByRole('button', { name: /^(Enter New York 1984|Resume 1984 Empire)/ }).first().tap();
      await page.getByRole('button', { name: 'Pause', exact: true }).waitFor({ state: 'visible' });
      await page.waitForTimeout(1500);
      const resume = page.getByRole('button', { name: /^Resume Game/ });
      if (await resume.isVisible()) {
        report.notes.push('game paused itself after start (fullscreen change); resumed');
        await resume.tap();
        await page.waitForTimeout(500);
      }
    });

    await step('tour hook', async () => {
      await page.waitForFunction(
        () => window.__cityTour && typeof window.__cityTour.teleport === 'function' && typeof window.__cityTour.frameTimeMs === 'function',
        null,
        { timeout: 10000 },
      );
    });

    // Turf tab: each "Travel Here" closes the dossier, so reopen it for every borough.
    const dock = page.getByRole('button', { name: /^Turf\b/ }).first();
    const closeButton = page.getByRole('button', { name: /^(Return to )?Street( \(Esc\))?$/ });
    const travel = page.getByRole('button', { name: 'Travel Here', exact: true });
    let count = EXPECTED_BOROUGH_BUTTONS;
    for (let i = 0; i < count; i += 1) {
      await step(`travel to borough ${i + 1}`, async () => {
        await dock.tap();
        await closeButton.waitFor({ state: 'visible' });
        await travel.first().waitFor({ state: 'visible' });
        if (i === 0) {
          count = await travel.count();
          if (count !== EXPECTED_BOROUGH_BUTTONS) {
            report.notes.push(`expected ${EXPECTED_BOROUGH_BUTTONS} Travel Here buttons, found ${count}`);
            report.failed = true;
          }
        }
        const btn = travel.nth(i);
        await btn.scrollIntoViewIfNeeded();
        await btn.tap();
        await closeButton.waitFor({ state: 'hidden' });
      });
      await shoot(page, `borough-${i + 1}`);
    }

    // Ferry: teleport next to the Battery terminal, then press the HUD prompt.
    await step('teleport to Battery terminal', async () => {
      await page.evaluate(({ x, y }) => window.__cityTour.teleport(x, y), { x: battery.x, y: battery.y });
      await page.waitForTimeout(600);
    });
    await step('ferry prompt', async () => {
      // HUD context prompt (bottom centre). Selected by its text: a button mentioning "ferry".
      const prompt = page.getByRole('button', { name: /ferry/i }).first();
      await prompt.waitFor({ state: 'visible', timeout: 8000 });
      await prompt.tap();
      await page.waitForTimeout(2500); // fade out, arrive, fade in
    });
    await shoot(page, 'staten-island');

    await readSlowestChunk(page);
    await context.close();
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}

let exitCode = 0;
try {
  await main();
} catch (err) {
  report.navigationError = err && err.message ? err.message : String(err);
  report.failed = true;
  exitCode = 2;
  console.error(`city-tour: navigation failed: ${report.navigationError}`);
  if (!err || !err.navigation) console.error(err);
}

if (report.shots.length !== 6 && !report.navigationError) {
  report.notes.push(`expected 6 screenshots, got ${report.shots.length}`);
  report.failed = true;
}
if (report.pageErrors.length > 0) report.failed = true;

const samples = report.frameTimeMs.samples;
report.frameTimeMs.average = samples.length > 0 ? Math.round((samples.reduce((a, b) => a + b, 0) / samples.length) * 100) / 100 : 'n/a';
if (exitCode === 0 && report.failed) exitCode = 1;

console.log(`CITY_TOUR_REPORT ${JSON.stringify(report)}`);
console.log(`city-tour average frame time ms: ${report.frameTimeMs.average}`);
console.log(`city-tour slowest chunk draw ms: ${report.slowestChunkDrawMs}`);
for (const e of report.pageErrors) console.log(`city-tour PAGE ERROR ${e}`);
for (const b of report.blankShots) console.log(`city-tour BLANK CITY ${b}`);
console.log(`city-tour ${exitCode === 0 ? 'PASS' : 'FAIL'}`);
process.exit(exitCode);
