// Offline artifact renderer; no preview server, no game-runtime changes.
import playwright from '../../../game/node_modules/playwright/index.js';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const here=path.dirname(fileURLToPath(import.meta.url));
const browser=await playwright.chromium.launch({headless:true,channel:'chrome'});
try {
  const page=await browser.newPage({viewport:{width:1920,height:1200},deviceScaleFactor:1});
  const review=[];
  for(const variant of ['A','B','C','D','E']){
    await page.goto(`file://${path.join(here,'index.html')}?variant=${variant}`);
    await page.evaluate(()=>document.fonts.ready);
    const checks=await page.evaluate(()=>{
      const buttons=[...document.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().width);
      return {title:document.querySelector('h1').textContent,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,smallButtons:buttons.filter(x=>x.getBoundingClientRect().height<40).length,hasEntry:document.body.innerText.includes('10/10'),hasEmpty:document.body.innerText.includes('0/10'),hasReturn:document.body.innerText.includes('Về rừng')};
    });
    if(checks.overflow||checks.smallButtons||!checks.hasEntry||!checks.hasEmpty||!checks.hasReturn)throw new Error(`${variant}: layout check failed ${JSON.stringify(checks)}`);
    await page.screenshot({path:path.join(here,`${variant}.png`)});
    review.push({variant,...checks});
  }
  await fs.writeFile(path.join(here,'render-checks.json'),JSON.stringify({scope:'Static mockup rendering only, not combat gameplay tests',viewport:{width:1920,height:1200},review},null,2)+'\n');
  console.log('Rendered A–E; static layout checks passed. Combat is not implemented or tested.');
} finally {await browser.close();}
