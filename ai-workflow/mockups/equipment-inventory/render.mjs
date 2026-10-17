import playwright from '../../../game/node_modules/playwright/index.js';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const browser=await playwright.chromium.launch({headless:true,channel:'chrome'});
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  for(const variant of ['A','B','C','D','E']){
    await page.goto(`file://${path.join(here,'index.html')}?variant=${variant}`);await page.evaluate(()=>document.fonts.ready);
    if(await page.locator('.cell').count()!==100)throw new Error('Not 100 slots');
    if(await page.locator('.equip-slot').count()!==10)throw new Error('Not 10 equip slots');
    await page.screenshot({path:path.join(here,`${variant}.png`)});
    const overflow=await page.locator('.shell').evaluate(el=>el.scrollWidth>el.clientWidth||el.scrollHeight>el.clientHeight);
    console.log(`${variant}: 100 inventory, 10 equipment, shell overflow=${overflow}`);
    if(overflow)throw new Error(`${variant}: panel overflow`);
    const visible=await page.locator('.cell:visible').count();
    if(visible!==(variant==='E'?25:100))throw new Error('Wrong visible slot count');
    await page.locator('#equip').click();if(!await page.locator('.toast').isVisible())throw new Error('Mock interaction failed');
    await page.keyboard.press('Escape');if(await page.locator('.shell').isVisible())throw new Error('Close failed');
    if(variant==='E'){await page.locator('#open').click();await page.locator('#next').click();if(!await page.locator('.pagination').innerText().then(t=>t.includes('26–50')))throw new Error('Page failed');}
  }
}finally{await browser.close();}
