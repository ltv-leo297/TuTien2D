import playwright from '../../../game/node_modules/playwright/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = playwright;
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

for (const variant of ['A', 'B', 'C', 'D', 'E']) {
  await page.goto(`file://${path.join(here, 'index.html')}?variant=${variant}`);
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(here, `${variant}.png`) });
}

await browser.close();
