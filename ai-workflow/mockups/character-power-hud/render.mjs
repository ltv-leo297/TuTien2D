import playwright from '../../../game/node_modules/playwright/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = playwright;
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

if (!process.argv.includes('--mockups-only')) {
await page.addInitScript(() => {
  localStorage.setItem('truc-khe.profile', JSON.stringify({ name: 'Vô Danh', hero: 'A' }));
});
await page.goto('http://127.0.0.1:4190/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Bước vào Trúc Khê' }).click();
await page.locator('.world-canvas').waitFor({ state: 'visible' });
await page.waitForTimeout(1000);
await page.addStyleTag({ content: '.game-shell > :not(.world-canvas){display:none!important}' });
await page.evaluate(() => {
  const canvas = document.querySelector('.world-canvas');
  const ctx = canvas.getContext('2d');
  const patches = [
    { x: 920, y: 100, w: 190, h: 42, sourceY: 148 },
    { x: 0, y: 470, w: 175, h: 58, sourceY: 538 },
    { x: 1735, y: 860, w: 185, h: 58, sourceY: 926 },
  ];
  for (const patch of patches) {
    const copy = document.createElement('canvas');
    copy.width = patch.w;
    copy.height = patch.h;
    copy.getContext('2d').drawImage(canvas, patch.x, patch.sourceY, patch.w, patch.h, 0, 0, patch.w, patch.h);
    ctx.drawImage(copy, patch.x, patch.y);
  }
  const frozen = document.createElement('canvas');
  frozen.className = 'world-canvas';
  frozen.width = canvas.width;
  frozen.height = canvas.height;
  frozen.style.cssText = canvas.style.cssText;
  frozen.getContext('2d').drawImage(canvas, 0, 0);
  canvas.replaceWith(frozen);
});
await page.locator('.world-canvas').screenshot({ path: path.join(here, 'scene-clean.png') });
}

for (const variant of ['A', 'B', 'C', 'D', 'E']) {
  await page.goto(`file://${path.join(here, 'index.html')}?variant=${variant}`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(here, `${variant}.png`) });
}

await browser.close();
