// Real-click test for Sweet Treats: Dessert Shop. Usage: node test.js <url> <outdir>
const { chromium } = require('playwright-core');
const fs = require('fs');
const [url, outdir] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || '' }); console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : '')); }
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--hatch-webgl-allowed-domains-file=/home/hatch/workspace/tools/pw-shot/webgl-policy.txt', '--hatch-webgl-allowed-domains-sha256=dc8a0e5eec744f6590a4c1889139c00568ffedc3eced6d0a1a5127e35f9ccd16'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  const state = () => page.evaluate(() => window.__sweetTreats ? window.__sweetTreats() : null);
  const clickStation = async (id) => {
    const s = await state();
    const pt = s.stationCentres[id];
    const box = await page.locator('#game').boundingBox();
    await page.mouse.click(box.x + pt[0] / 100 * box.width, box.y + pt[1] / 100 * box.height);
    await page.waitForTimeout(150);
  };
  const serveCustomer = async () => {
    for (let i = 0; i < 10; i++) {
      const s = await state();
      if (!s || s.screen !== 'playing') return s;
      await clickStation(s.nextStep);
    }
    return await state();
  };

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  let s = await state();
  check('loads, hook present, menu screen', s && s.screen === 'menu', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/01-menu.png' });

  await page.click('#btn-start');
  await page.waitForTimeout(400);
  s = await state();
  check('start -> playing customer 1 Pip, 3 steps', s && s.screen === 'playing' && s.level === 1 && s.customer === 'Pip' && s.steps.length === 3, JSON.stringify(s));
  await page.screenshot({ path: outdir + '/02-customer1.png' });

  // Wrong tap: tap a station that is not next
  const wrongBefore = s.wrong, patienceBefore = s.patience;
  const wrongId = s.nextStep === 'bowl' ? 'sprinkle' : 'bowl';
  await clickStation(wrongId);
  s = await state();
  check('wrong tap: wrong+1, stepIndex unchanged, patience drops', s.wrong === wrongBefore + 1 && s.stepIndex === 0 && s.patience < patienceBefore, JSON.stringify(s));

  // Serve customer 1 correctly
  s = await serveCustomer();
  await page.waitForTimeout(400);
  s = await state();
  check('correct steps -> served screen, coins earned', s && s.screen === 'served' && s.coins > 0 && s.servedCount === 1, JSON.stringify(s));
  await page.screenshot({ path: outdir + '/03-served.png' });

  // Shop: open, buy an upgrade if affordable, close back to served
  await page.click('#btn-shop');
  await page.waitForTimeout(300);
  s = await state();
  check('shop overlay opens', s.screen === 'shop', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/04-shop.png' });
  const coinsBefore = s.coins;
  await page.click('#btn-buy-jar'); // 40 coins; may or may not be affordable — just record
  await page.waitForTimeout(200);
  s = await state();
  console.log('  shop buy attempt: coins ' + coinsBefore + ' -> ' + s.coins + ', jar lv ' + s.upgrades.jar);
  await page.click('#btn-shop-close');
  await page.waitForTimeout(300);
  s = await state();
  check('shop close -> back to served', s.screen === 'served', JSON.stringify(s));

  // Next -> customer 2
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  s = await state();
  check('next -> playing customer 2', s && s.screen === 'playing' && s.level === 2, JSON.stringify(s));

  // Pause / resume / mute
  await page.click('#btn-pause'); await page.waitForTimeout(200); s = await state();
  check('pause -> paused', s.screen === 'paused', JSON.stringify(s));
  await page.click('#btn-resume'); await page.waitForTimeout(200); s = await state();
  check('resume -> playing', s.screen === 'playing', JSON.stringify(s));
  await page.click('#btn-mute'); s = await state();
  check('mute toggles on', s.muted === true, JSON.stringify(s));
  await page.click('#btn-mute');

  // Full playthrough customers 2..20
  let won = false, guard = 0;
  while (guard++ < 100) {
    s = await state();
    if (!s) break;
    if (s.screen === 'win') { won = true; break; }
    if (s.screen === 'playing') {
      if (s.level === 10 && s.stepIndex === 0) await page.screenshot({ path: outdir + '/05-level10.png' });
      if (s.level === 20 && s.stepIndex === 0) await page.screenshot({ path: outdir + '/06-level20.png' });
      await serveCustomer();
      await page.waitForTimeout(350);
    } else if (s.screen === 'served') {
      await page.click('#btn-next'); await page.waitForTimeout(350);
    } else if (s.screen === 'over') {
      await page.click('#btn-retry'); await page.waitForTimeout(350);
    } else break;
  }
  s = await state();
  check('full playthrough reaches WIN after 20 customers', won && s.screen === 'win', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/07-win.png' });

  await page.click('#btn-again'); await page.waitForTimeout(400);
  s = await state();
  check('play again -> customer 1 playing, coins 0', s && s.screen === 'playing' && s.level === 1 && s.coins === 0, JSON.stringify(s));

  check('no page/console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('TEST CRASH', e); process.exit(2); });
