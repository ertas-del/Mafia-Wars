#!/usr/bin/env node
// Phone-layout check (PATCH-002, AC-006): serves the built dist/ folder, drives
// Playwright Chromium as a 915x412 landscape touch phone, visits the title, the
// HUD in play, all five dossier tabs and the pause screen, and on each screen
// records horizontal overflow and visible controls shorter than 44 px.
//
// Output: one line `PHONE_LAYOUT_REPORT {json}` on stdout, screenshots in
// ./phone-layout-shots/. Exit 0 = clean, 1 = violations, 2 = navigation failed.
//
// Usage: node scripts/phone-layout-check.mjs [distDir]

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST_DIR = path.resolve(process.argv[2] || process.env.DIST_DIR || 'dist');
const SHOTS_DIR = path.resolve('phone-layout-shots');
const VIEWPORT = { width: 915, height: 412 };
const MIN_CONTROL_HEIGHT = 44;
const STEP_TIMEOUT = 15000;

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

/** Runs in the page: measures overflow and short controls on the current screen. */
function measureInPage(minHeight) {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const label = (el) => {
    const raw =
      el.getAttribute('aria-label') ||
      (el.innerText || '').trim() ||
      el.value ||
      el.getAttribute('placeholder') ||
      el.getAttribute('title') ||
      el.id ||
      el.tagName.toLowerCase();
    return String(raw).replace(/\s+/g, ' ').slice(0, 80);
  };
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    if (typeof el.checkVisibility === 'function') {
      return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    }
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
  };
  // True when el or an ancestor is a horizontally scrollable container by design.
  const inHorizontalScroller = (el) => {
    for (let n = el; n && n !== de && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };

  // Width check (fails on): document scrollWidth > clientWidth.
  // Diagnostic only (does not fail): visible elements whose box leaves the viewport
  // horizontally, skipping designed horizontal scrollers, the canvas and SVG internals.
  const offscreen = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (['script', 'style', 'link', 'meta', 'noscript', 'canvas'].includes(el.tagName.toLowerCase())) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (r.left >= -1 && r.right <= vw + 1) continue;
    if (!isVisible(el) || inHorizontalScroller(el)) continue;
    offscreen.push({
      tag: el.tagName.toLowerCase(),
      label: label(el),
      left: Math.round(r.left * 10) / 10,
      right: Math.round(r.right * 10) / 10,
    });
    if (offscreen.length >= 25) break;
  }

  // Height check: every visible control, including those inside scrollers.
  const shortControls = [];
  const controls = document.querySelectorAll(
    'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], input[type="text"], input:not([type])',
  );
  for (const el of controls) {
    if (!isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height + 0.01 < minHeight) {
      shortControls.push({
        tag: el.tagName.toLowerCase(),
        label: label(el),
        height: Math.round(r.height * 100) / 100,
        width: Math.round(r.width * 100) / 100,
      });
    }
  }

  return {
    dataInput: de.dataset.input || null,
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    docOverflow: de.scrollWidth > de.clientWidth,
    offscreen,
    shortControls,
    controlsChecked: controls.length,
  };
}

const report = {
  viewport: { ...VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  dist: DIST_DIR,
  screens: [],
  pageErrors: [],
  notes: [],
  navigationError: null,
  failed: false,
};

let shotIndex = 0;
async function record(page, name) {
  await page.evaluate(() => {
    document.documentElement.dataset.input = 'touch';
  });
  await page.waitForTimeout(250);
  const m = await page.evaluate(measureInPage, MIN_CONTROL_HEIGHT);
  shotIndex += 1;
  const file = `${String(shotIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(SHOTS_DIR, file), fullPage: false });
  const ok = !m.docOverflow && m.shortControls.length === 0;
  report.screens.push({ name, ok, screenshot: file, ...m });
  if (!ok) report.failed = true;
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

async function main() {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    throw Object.assign(new Error(`no index.html in ${DIST_DIR}; run npm run build first`), { navigation: true });
  }
  fs.mkdirSync(SHOTS_DIR, { recursive: true });

  const server = await startServer(DIST_DIR);
  const baseUrl = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      screen: VIEWPORT,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(STEP_TIMEOUT);
    page.on('pageerror', (err) => report.pageErrors.push(String(err && err.message ? err.message : err).slice(0, 300)));

    // Title screen
    await step('title screen', async () => {
      await page.goto(baseUrl, { waitUntil: 'load', timeout: 30000 });
      await page.locator('#don-name-input').waitFor({ state: 'visible' });
      await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
      // A real touch at the top edge flips the game's own touch mode on.
      await page.touchscreen.tap(VIEWPORT.width / 2, 6);
      await page.waitForFunction(() => document.documentElement.dataset.input === 'touch', null, { timeout: 5000 })
        .catch(() => report.notes.push('touchstart did not set data-input; set explicitly'));
    });
    await record(page, 'title');

    // Start a new game
    await step('start game', async () => {
      await page.getByRole('button', { name: /^(Enter New York 1984|Resume 1984 Empire)/ }).first().tap();
      await page.getByRole('button', { name: 'Pause', exact: true }).waitFor({ state: 'visible' });
      await page.waitForTimeout(1500);
      // Fullscreen exit pauses touch play; if that happened in headless, resume.
      const resume = page.getByRole('button', { name: /^Resume Game/ });
      if (await resume.isVisible()) {
        report.notes.push('game paused itself after start (fullscreen change); resumed');
        await resume.tap();
        await page.waitForTimeout(500);
      }
    });
    await record(page, 'hud-play');

    // Five dossier tabs, each opened from the HUD dock and closed again
    const tabs = [
      { name: 'dossier-turf', dock: /^Turf\b/, tab: /^Boroughs & Rackets/ },
      { name: 'dossier-inner-circle', dock: /^(Inner )?Circle\b/, tab: /^Inner Circle & Favors/ },
      { name: 'dossier-skill-tree', dock: /^Skill\b/, tab: /^Skill Tree/ },
      { name: 'dossier-offline-vault', dock: /^(Offline )?Vault$/, tab: /^Offline Vault & Ledger/ },
      { name: 'dossier-leaderboard', dock: /^(Leaderboard|Ranks)$/, tab: /^Global Standings/ },
    ];
    const closeButton = page.getByRole('button', { name: /^(Return to )?Street( \(Esc\))?$/ });
    for (const t of tabs) {
      await step(`open ${t.name}`, async () => {
        await page.getByRole('button', { name: t.dock }).first().tap();
        await closeButton.waitFor({ state: 'visible' });
        const tabBtn = page.getByRole('button', { name: t.tab }).first();
        await tabBtn.waitFor({ state: 'visible' });
        const active = await tabBtn.evaluate((el) => el.className.includes('bg-[#B91C1C]'));
        if (!active) throw new Error(`tab ${t.tab} is not the active tab`);
        await page.waitForTimeout(300);
      });
      await record(page, t.name);
      await step(`close ${t.name}`, async () => {
        await closeButton.tap();
        await closeButton.waitFor({ state: 'hidden' });
      });
    }

    // Pause screen
    await step('pause', async () => {
      await page.getByRole('button', { name: 'Pause', exact: true }).tap();
      await page.getByRole('heading', { name: 'Syndicate Operations Paused' }).waitFor({ state: 'visible' });
      await page.getByRole('button', { name: /^Resume Game/ }).waitFor({ state: 'visible' });
    });
    await record(page, 'pause');

    await context.close();
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}

let exitCode = 0;
try {
  await main();
  exitCode = report.failed ? 1 : 0;
} catch (err) {
  report.navigationError = err && err.message ? err.message : String(err);
  report.failed = true;
  exitCode = 2;
  console.error(`phone-layout-check: navigation failed: ${report.navigationError}`);
  if (!err || !err.navigation) console.error(err);
}

console.log(`PHONE_LAYOUT_REPORT ${JSON.stringify(report)}`);
for (const s of report.screens) {
  const problems = [];
  if (s.docOverflow) problems.push(`scrollWidth ${s.scrollWidth} > clientWidth ${s.clientWidth}`);
  for (const o of s.offscreen) problems.push(`(info) offscreen <${o.tag}> "${o.label}" x ${o.left}..${o.right}`);
  for (const c of s.shortControls) problems.push(`short <${c.tag}> "${c.label}" height ${c.height}`);
  console.log(`phone-layout ${s.ok ? 'PASS' : 'FAIL'} ${s.name}${problems.length ? '\n  - ' + problems.join('\n  - ') : ''}`);
}
process.exit(exitCode);
