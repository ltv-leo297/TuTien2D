import {createRequire} from 'node:module';
const {chromium}=createRequire(new URL('../game/package.json',import.meta.url))('@playwright/test');
const browser=await chromium.launch({channel:'chrome'});
const context=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:'ai-workflow/reports/forest-rebuild-video',size:{width:1280,height:720}}});
try{
 const page=await context.newPage();await page.addInitScript(()=>localStorage.setItem('truc-khe.combat.v1',JSON.stringify({version:1,monsters:{},returnTo:{map:'forest',pos:{x:1225,y:550},direction:0}})));
 await page.goto('http://127.0.0.1:4181/?debug=1');await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();await page.locator('.world-canvas').waitFor();
 await page.waitForTimeout(3000);await page.screenshot({path:'ai-workflow/reports/forest-rebuild-runtime.png'});
 const box=await page.locator('.map-card canvas').boundingBox();await page.locator('.map-card canvas').click({position:{x:780/1672*box.width,y:480/941*box.height}});
 await page.waitForTimeout(5500);await page.screenshot({path:'ai-workflow/reports/forest-rebuild-bridge.png'});
 const a=await page.evaluate(()=>window.__game.snapshot().actors.find(a=>a.id==='jade-beast'));
 await page.locator('.world-canvas').click({position:{x:a.x,y:a.y-70}});await page.locator('.encounter-card').waitFor({timeout:18000});await page.locator('.encounter-card .battle-primary').click();await page.locator('.combat-shell').waitFor();
 await page.waitForTimeout(6000);await page.screenshot({path:'ai-workflow/reports/forest-rebuild-combat.png'});await page.keyboard.press('Space');await page.waitForTimeout(5000);
 await context.close();await page.video().saveAs('ai-workflow/reports/forest-rebuild-gameplay.webm');
 console.log('Saved production gameplay video and screenshots.');
}finally{await browser.close();}
