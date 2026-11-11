// Contracts smoke run (AC-004, AC-005). Drives the ?tour hooks on a built game and prints one JSON report.
// Usage: node scripts/contracts-smoke.mjs <built-dir> <shots-dir>
// The build can be `vite build` output or the esbuild smoke build; the canvas is what is judged.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(process.env.PLAYWRIGHT_FROM || import.meta.url);
const { chromium } = require('playwright');
const [dir, shotsDir] = process.argv.slice(2);
fs.mkdirSync(shotsDir, { recursive: true });
const SAVE = 'commission_1984_empire_v1';
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  let p = path.join(dir, u === '/' ? 'index.html' : u);
  if (!fs.existsSync(p)) p = path.join(dir, u.replace(/^\/[^/]+\//, '/'));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
await new Promise((res) => server.listen(0, res));
const base = `http://127.0.0.1:${server.address().port}/`;

const report = { checks: {}, errors: [], notes: [] };
const ok = (name, pass, detail) => { report.checks[name] = { pass: Boolean(pass), detail }; };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
page.on('pageerror', (e) => report.errors.push(e.message));

let clockOffset = 0;
const hp = async () => {
  const t = await page.locator('text=/HP: \\d+\\/\\d+/').first().textContent().catch(() => null);
  const m = t && t.match(/HP: (\d+)\/(\d+)/);
  return m ? Number(m[1]) : null;
};
const save = () => page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, SAVE);
const tour = (fn, ...a) => page.evaluate(([f, args]) => window.__cityTour[f](...args), [fn, a]);
const shot = async (name) => { await page.screenshot({ path: path.join(shotsDir, `${name}.png`) }); };
const advance = async (ms) => { clockOffset += ms; await tour('advanceClock', ms); };
const pageNow = () => page.evaluate(() => Date.now());

try {
  await page.goto(base + '?tour');
  await page.waitForTimeout(800);
  await page.evaluate((k) => localStorage.removeItem(k), SAVE);
  await page.reload();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^(Enter New York 1984|Resume 1984 Empire)/ }).first().click();
  await page.waitForFunction(() => window.__cityTour && typeof window.__cityTour.addGrudge === 'function', null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const resume = page.getByRole('button', { name: /^Resume/ });
  if (await resume.count()) await resume.first().click().catch(() => {});

  // AC-004: peace. Walk among the Lower Manhattan crew for 60 s at heat 0.
  await tour('setHeat', 0);
  const hp0 = await hp();
  const keys = ['d', 's', 'a', 'w'];
  for (let i = 0; i < 12; i++) {
    const k = keys[i % 4];
    await page.keyboard.down(k); await page.waitForTimeout(2500); await page.keyboard.up(k);
    await page.waitForTimeout(2500);
  }
  const hp1 = await hp();
  ok('peace-60s', hp0 !== null && hp1 === hp0, { hpBefore: hp0, hpAfter: hp1 });
  await shot('1-peace');

  // AC-004: a contract makes that family attack; a squad hunts the player; another family stays peaceful.
  await tour('addGrudge', 'corvini', 3);
  await page.waitForTimeout(500);
  const s1 = await save();
  ok('contract-started', s1?.contracts?.families?.corvini?.contract === true, s1?.contracts?.families?.corvini);
  ok('other-family-peace', s1?.contracts?.families?.moretti?.contract === false, s1?.contracts?.families?.moretti);
  const hpA = await hp();
  const squad = await tour('spawnSquad', 'corvini');
  let hpB = hpA;
  for (let i = 0; i < 20 && hpB === hpA; i++) { await page.waitForTimeout(1000); hpB = await hp(); }
  ok('squad-hunts', squad && hpB !== null && hpA !== null && hpB < hpA, { squadSpawned: squad, hpBefore: hpA, hpAfter: hpB });
  await shot('2-squad');

  // AC-004: NYPD attack at heat 55. Clear the contract first by giving the player time, then watch for cops.
  report.notes.push('NYPD at heat 55 is checked by screenshot; the unit test covers the 54/55 line.');
  await tour('setHeat', 55);
  await page.waitForTimeout(8000);
  await shot('3-heat55');
  await tour('setHeat', 0);

  // AC-005: request a sit-down from the dossier, fast-forward to the window, walk there and sit.
  const outcomes = { honoured: false, betrayed: false };
  for (let round = 0; round < 12 && !(outcomes.honoured && outcomes.betrayed); round++) {
    let before = await save();
    if ((before?.cash ?? 0) < 20000) {
      // Top up cash through the save so every round can afford the price, then resume the game.
      await page.evaluate((k) => { const v = JSON.parse(localStorage.getItem(k)); v.cash = 200000; localStorage.setItem(k, JSON.stringify(v)); }, SAVE);
      clockOffset = 0;
      await page.reload();
      await page.waitForTimeout(800);
      await page.getByRole('button', { name: /^(Enter New York 1984|Resume 1984 Empire)/ }).first().click();
      await page.waitForFunction(() => window.__cityTour && typeof window.__cityTour.addGrudge === 'function', null, { timeout: 15000 });
      await page.waitForTimeout(1500);
      before = await save();
    }
    if (!before?.contracts?.families?.corvini?.contract) { await tour('addGrudge', 'corvini', 3); await page.waitForTimeout(400); }
    await page.getByRole('button', { name: /^Turf\b/ }).first().click();
    await page.getByRole('button', { name: 'Request Sit-Down' }).first().click({ timeout: 10000 });
    await page.waitForTimeout(600);
    if (round === 0) await shot('4-dossier-requested');
    await page.getByRole('button', { name: /^(Return to )?Street( \(Esc\))?$/ }).first().click();
    await page.waitForTimeout(600);
    const st = await save();
    const sd = st?.contracts?.families?.corvini?.sitDown;
    if (!sd) { report.notes.push(`round ${round}: no sit-down scheduled`); continue; }
    if (st.cash < (st.contracts.families.corvini.price || 0)) report.notes.push(`round ${round}: short of cash`);
    const now = (await pageNow()) + clockOffset;
    await advance(Math.max(0, sd.meetAt - now) + 2000);
    await page.evaluate(([x, y]) => window.__cityTour.teleport(x, y), [sd.spot.x, sd.spot.y]);
    await page.waitForTimeout(1500);
    if (round === 0) await shot('5-sitdown-prompt');
    const cashBefore = (await save())?.cash;
    await page.keyboard.press('e');
    await page.waitForTimeout(1500);
    const betrayedScreen = page.locator('[data-recovery="betrayal"]');
    if (await betrayedScreen.count()) {
      if (!outcomes.betrayed) await shot('6-betrayed');
      const after = await save();
      outcomes.betrayed = true;
      ok('betrayed-keeps-contract', after?.contracts?.families?.corvini?.contract === true, { price: after?.contracts?.families?.corvini?.price });
      await page.getByRole('button', { name: 'Wake Up at the Station' }).click();
      await page.waitForTimeout(1200);
      await shot('7-woke');
    } else {
      const after = await save();
      const g = after?.contracts?.families?.corvini;
      if (g && g.contract === false) {
        outcomes.honoured = true;
        ok('honoured-clears', g.points === 0 && g.price === 0 && after.cash < cashBefore, { cashBefore, cashAfter: after.cash, grudge: g });
      } else report.notes.push(`round ${round}: no outcome (prompt not reached?)`);
    }
  }
  ok('sitdown-honoured-seen', outcomes.honoured);
  ok('sitdown-betrayed-seen', outcomes.betrayed);
} catch (e) {
  report.errors.push('script: ' + (e && e.message));
}
ok('no-page-errors', report.errors.length === 0, report.errors.slice(0, 5));
console.log('CONTRACTS_SMOKE ' + JSON.stringify(report));
await browser.close();
server.close();
process.exit(Object.values(report.checks).every((c) => c.pass) ? 0 : 1);
