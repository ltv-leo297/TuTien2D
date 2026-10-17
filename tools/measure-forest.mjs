import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(new URL('../game/package.json',import.meta.url))('@playwright/test');
const browser=await chromium.launch({channel:'chrome'}),results=[];
try{for(const [width,height,dpr] of [[1280,720,1],[1920,1080,2],[2560,1440,1],[720,900,2]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr}),page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('truc-khe.combat.v1',JSON.stringify({version:1,monsters:{},returnTo:{map:'forest',pos:{x:1225,y:550},direction:0}})));
 await page.goto('http://127.0.0.1:4181/?debug=1');await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();await page.waitForTimeout(4000);
 const start=await page.evaluate(()=>window.__game.snapshot().frameTimes.length);await page.waitForTimeout(4000);
 const samples=await page.evaluate(start=>window.__game.snapshot().frameTimes.slice(start),start),sorted=samples.slice().sort((a,b)=>a-b);
 results.push({width,height,dpr,samples:samples.length,averageFps:1000/(samples.reduce((a,b)=>a+b,0)/samples.length),p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)});await context.close();
}}finally{await browser.close();}
fs.writeFileSync(process.argv[2]??'ai-workflow/reports/forest-corrected-performance.json',JSON.stringify({browser:'Chrome headless, production build, effects on; 4s warmup + 4s sample, no screenshots or resizing during sample',results},null,2)+'\n');console.log(results);
