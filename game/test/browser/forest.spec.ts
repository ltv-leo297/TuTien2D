import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {SCENES,blocked} from '../../src/engine/scene';
const snapshot=(p:Page)=>p.evaluate(()=>(window as any).__game.snapshot());
async function start(page:Page,locale='vi'){
 await page.addInitScript(locale=>{localStorage.setItem('truc-khe.locale',JSON.stringify(locale));if(!sessionStorage.getItem('forest-test')){localStorage.setItem('truc-khe.combat.v1',JSON.stringify({version:1,monsters:{},returnTo:{map:'forest',pos:{x:1225,y:550},direction:0}}));sessionStorage.setItem('forest-test','1');}},locale);
 await page.goto('/?debug=1');await page.getByRole('button',{name:locale==='vi'?'Bước vào Trúc Khê':'Enter Truc Khe',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).map).toBe('forest');
}
async function click(page:Page,x:number,y:number){const mini=page.locator('.map-card canvas'),box=(await mini.boundingBox())!;await mini.click({position:{x:x/1920*box.width,y:y/1080*box.height}});}
async function actor(page:Page,id:string){const a=(await snapshot(page)).actors.find((a:any)=>a.id===id);await click(page,a.x,a.y);}

test('forest E plants: approach, inventory species/levels, cooldown, persistence and return gate',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1920,height:1080});await start(page);
 for(const [id,item,count] of [['spirit-grass-1','spirit-grass',1],['spirit-grass-2','spirit-grass',2],['dew-flower-2','dew-flower',1],['dew-flower-1','dew-flower',2],['jade-herb','jade-herb',1],['purple-lingzhi','purple-lingzhi',1]] as const){
  await actor(page,id);await expect.poll(async()=>(await snapshot(page)).bag[item],{timeout:18000}).toBe(count);
  expect(blocked(SCENES.forest,(await snapshot(page)).pos)).toBe(false);
  await actor(page,id);await page.waitForTimeout(150);expect((await snapshot(page)).bag[item]).toBe(count);
 }
 await page.getByRole('button',{name:'Hành trang',exact:true}).click();await page.locator('.item-cell[data-item="jade-herb"]').click();await expect(page.locator('.item-detail')).toContainText('Ngọc Tủy Thảo');await expect(page.locator('.item-detail img')).toHaveJSProperty('naturalWidth',256);await page.screenshot({path:'test-results/forest-E-inventory.png'});await page.keyboard.press('Escape');
 const bag=(await snapshot(page)).bag;await page.reload();await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).bag).toEqual(bag);
 await click(page,21,535);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('forest');await click(page,1899,535);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('village');expect(errors).toEqual([]);
});
for(const id of ['bamboo-serpent','jade-beast'])test(`forest E ${id}: approach → combat skill → retreat → same location and charge`,async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await start(page);const a=(await snapshot(page)).actors.find((a:any)=>a.id===id);await page.locator('.world-canvas').click({position:{x:a.x,y:a.y-(id==='jade-beast'?60:40)}});await expect(page.locator('.encounter-card')).toBeVisible({timeout:18000});const origin=(await snapshot(page)).pos;
 await expect(page.locator('.encounter-count')).toContainText('10/10');await page.locator('.encounter-card .battle-primary').click();await expect(page.locator('.combat-shell')).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).__combat.snapshot().phase),{timeout:10000,intervals:[50]}).toMatch(/^warn-/);await page.screenshot({path:`test-results/forest-E-combat-${id}.png`});
 await expect(page.locator('.combat-shell')).not.toContainText(/lượt|countdown|hồi/);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Rút lui',exact:true}).click();await page.getByRole('button',{name:'Rút lui',exact:true}).click();await page.getByRole('button',{name:'Về rừng',exact:true}).click();expect((await snapshot(page)).pos).toEqual(origin);await actor(page,id);await expect(page.locator('.encounter-count')).toContainText('9/10');
});
for(const [width,height,dpr] of [[1280,720,1],[1920,1080,2],[2560,1440,1],[720,900,2]])test(`forest E viewport ${width}x${height} DPR${dpr}: click and resize`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,'en');await page.waitForTimeout(1200);
 expect((await snapshot(page)).backing).toEqual({width:width*dpr,height:height*dpr});
 await page.screenshot({path:`test-results/forest-E-${width}-${height}-${dpr}.png`});
 await page.setViewportSize({width:1100,height:760});await expect.poll(async()=>(await snapshot(page)).backing).toEqual({width:1100*dpr,height:760*dpr});
 const s=await snapshot(page),target={x:1260,y:555};await page.locator('.world-canvas').click({position:{x:(target.x-s.camera.x)*s.camera.scale,y:(target.y-s.camera.y)*s.camera.scale}});await expect.poll(async()=>Math.hypot((await snapshot(page)).pos.x-target.x,(await snapshot(page)).pos.y-target.y)).toBeLessThan(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 const perf=await snapshot(page),frames=perf.frameTimes.slice(30).sort((a:number,b:number)=>a-b);await info.attach('forest-performance',{body:JSON.stringify({width,height,dpr,samples:frames.length,p95:frames[Math.floor(frames.length*.95)],fps:perf.fps}),contentType:'application/json'});await context.close();
});
test('forest E waterfall animates and reduced motion freezes its actual region',async({page},info)=>{
 await page.setViewportSize({width:1920,height:1080});await start(page);await page.waitForTimeout(2000);const clip={x:935,y:105,width:20,height:60};const moving=await page.screenshot({clip});await page.waitForTimeout(350);expect(moving.equals(await page.screenshot({clip}))).toBe(false);
 await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Giảm chuyển động',{exact:true}).check();await page.keyboard.press('Escape');const frozen=await page.screenshot({clip});await page.waitForTimeout(350);expect(frozen.equals(await page.screenshot({clip}))).toBe(true);
 await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Giảm chuyển động',{exact:true}).uncheck();await page.keyboard.press('Escape');await page.waitForTimeout(2500);const s=await snapshot(page),frames=s.frameTimes.slice(60).sort((a:number,b:number)=>a-b);await info.attach('forest-steady-state',{body:JSON.stringify({viewport:[1920,1080],dpr:1,samples:frames.length,p95:frames[Math.floor(frames.length*.95)],fps:1000/(frames.reduce((a:number,b:number)=>a+b,0)/frames.length)}),contentType:'application/json'});await page.screenshot({path:'test-results/forest-E-final.png'});
});

test('selected forest: walks across wooden bridge and remains on its deck',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await start(page);
 const mid={x:780*1920/1672,y:480*1080/941},west={x:650*1920/1672,y:475*1080/941};
 await click(page,mid.x,mid.y);await expect.poll(async()=>Math.hypot((await snapshot(page)).pos.x-mid.x,(await snapshot(page)).pos.y-mid.y),{timeout:10000}).toBeLessThan(2);
 await page.screenshot({path:'test-results/forest-corrected-bridge.png'});
 await click(page,west.x,west.y);await expect.poll(async()=>Math.hypot((await snapshot(page)).pos.x-west.x,(await snapshot(page)).pos.y-west.y),{timeout:10000}).toBeLessThan(2);
 expect(blocked(SCENES.forest,(await snapshot(page)).pos)).toBe(false);
});

test('forest layers: crowns, bamboo, stream and all four monster poses move independently and freeze with reduced motion',async({page},info)=>{
 await page.setViewportSize({width:1920,height:1080});await start(page);await page.waitForTimeout(1000);
 const regions=[{id:'crown',x:1370,y:40,w:160,h:125},{id:'bamboo',x:565,y:305,w:110,h:90},{id:'water',x:906,y:85,w:45,h:120},
  {id:'wood',x:375,y:405,w:65,h:63},{id:'spore',x:266,y:375,w:55,h:52},{id:'snake',x:1525,y:310,w:85,h:75},{id:'beast',x:230,y:585,w:185,h:167}];
 async function changesOverCycle(samples:number){return page.evaluate(async({regions,samples})=>{
  const c=document.querySelector('.world-canvas') as HTMLCanvasElement,g=c.getContext('2d')!;
  const capture=()=>regions.map(r=>g.getImageData(r.x,r.y,r.w,r.h).data);
  const initial=capture(),max=regions.map(()=>0),start=(window as any).__game.snapshot().time;
  for(let sample=0;sample<samples;sample++){
   await new Promise(resolve=>setTimeout(resolve,180));const current=capture();
   current.forEach((pixels,i)=>{let changed=0;for(let j=0;j<pixels.length;j++)if(j%4!==3&&Math.abs(pixels[j]-initial[i][j])>8)changed++;max[i]=Math.max(max[i],changed/(pixels.length*.75));});
  }
  return regions.map((r,i)=>({id:r.id,changed:max[i],start,end:(window as any).__game.snapshot().time}));
 },{regions,samples});}
 // Sample an entire loop in the browser. Returning large pixel arrays over CDP could
 // delay the second sample by a whole cycle and accidentally compare identical poses.
 const changes=await changesOverCycle(9);
 for(const change of changes)expect(change.changed,change.id).toBeGreaterThan(.01);
 await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Giảm chuyển động',{exact:true}).check();await page.keyboard.press('Escape');await page.waitForTimeout(100);
 const frozen=await changesOverCycle(3);for(const change of frozen)expect(change.changed,change.id).toBe(0);
 await info.attach('independent-animation-regions',{body:JSON.stringify(changes),contentType:'application/json'});
});
