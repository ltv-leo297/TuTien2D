import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
const saveKey='truc-khe.combat.v1';
type World={map:string;pos:{x:number;y:number};camera:{x:number;y:number;scale:number};bag:Record<string,number>};
type Fight={x:number;y:number;time:number;hp:number;enemyHp:number;stamina:number;mana:number;paused:boolean;input:string[];outcome:string|null;enemyX:number;phase:string;enemySkill:string|null;skillCooldown:number;decisions:{id:string}[];enemyStats:Record<string,number>;frameTimes:number[];backing:{width:number;height:number}};
const world=(page:Page)=>page.evaluate(()=>(window as unknown as {__game:{snapshot:()=>World}}).__game.snapshot());
const fight=(page:Page)=>page.evaluate(()=>(window as unknown as {__combat:{snapshot:()=>Fight}}).__combat.snapshot());
async function mapClick(page:Page,x:number,y:number){const mini=page.locator('.map-card canvas'),box=(await mini.boundingBox())!;await mini.click({position:{x:x/1920*box.width,y:y/1080*box.height}});}
async function seedForest(page:Page,entries:unknown[]=[],locale='vi',hero='A'){
  await page.addInitScript(({saveKey,entries,locale,hero})=>{
    if(!sessionStorage.getItem('combat-fixture')){localStorage.setItem(saveKey,JSON.stringify({version:1,monsters:{'wood-yao':entries,'spore-yao':[]},returnTo:{map:'forest',pos:{x:365,y:468},direction:0}}));localStorage.setItem('truc-khe.locale',JSON.stringify(locale));localStorage.setItem('truc-khe.progress',JSON.stringify({bag:{herb:2},visited:['teacher']}));sessionStorage.setItem('combat-fixture','1');}
    sessionStorage.setItem('test-hero',hero);
  },{saveKey,entries,locale,hero});
}
async function enter(page:Page,locale='vi',hero='A'){
  await page.goto('/?debug=1');if(hero!=='A')await page.locator('.hero-option').nth('ABCD'.indexOf(hero)).click();await page.getByRole('button',{name:locale==='vi'?'Bước vào Trúc Khê':'Enter Truc Khe',exact:true}).click();await expect(page.locator('.world-canvas')).toBeVisible();
}
async function encounter(page:Page,monster='wood-yao'){
  await expect.poll(async()=>(await world(page)).map).toBe('forest');const actor=(await page.evaluate(()=>(window as any).__game.snapshot())).actors.find((a:{id:string})=>a.id===monster);await mapClick(page,actor.x,actor.y);await expect(page.locator('.encounter-card')).toBeVisible({timeout:12000});
}
async function begin(page:Page){await page.locator('.encounter-card .battle-primary').click();await expect(page.locator('.combat-shell')).toBeVisible({timeout:20000});await expect.poll(async()=>(await fight(page)).time).toBeGreaterThan(0);}
async function retreat(page:Page){await page.keyboard.press('Escape');await page.getByRole('button',{name:'Rút lui',exact:true}).click();await page.getByRole('button',{name:'Rút lui',exact:true}).click();await page.getByRole('button',{name:'Về rừng',exact:true}).click();await expect(page.locator('.combat-shell')).toHaveCount(0);}
async function winFight(page:Page){
  let held='';await page.keyboard.down('KeyJ');
  try{for(let i=0;i<400;i++){
    const s=await fight(page);if(s.outcome){expect(s.outcome).toBe('win');return;}
    const delta=s.enemyX-s.x,next=Math.abs(delta)>75?(delta>0?'KeyD':'KeyA'):'';
    if(next!==held){if(held)await page.keyboard.up(held);if(next)await page.keyboard.down(next);held=next;}
    if(s.skillCooldown===0&&s.mana>=18)await page.keyboard.press('KeyL');
    await page.waitForTimeout(60);
  }throw new Error('No victory within combat harness budget');}finally{if(held)await page.keyboard.up(held);await page.keyboard.up('KeyJ');}
}

test('full forest gate → encounter → battle → victory → exact return; count only outside, saved once',async({page},info)=>{
  await page.setViewportSize({width:1920,height:1080});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);await mapClick(page,21,535);await expect.poll(async()=>(await world(page)).map,{timeout:15000}).toBe('forest');await encounter(page);await expect(page.locator('.encounter-card')).toContainText('Còn 10/10 lượt chiến đấu');await expect(page.locator('.encounter-card')).not.toContainText(/05:00|5 phút|hồi lượt/);const origin=(await world(page)).pos;await page.screenshot({path:'test-results/combat-encounter.png'});
  await begin(page);await expect(page.locator('.combat-shell')).not.toContainText(/lượt|phút|hồi|remaining|recharge|\/10\b/);await page.keyboard.down('KeyD');await expect.poll(async()=>{const s=await fight(page);return s.enemyX-s.x;},{timeout:5000,intervals:[20]}).toBeLessThan(90);await page.keyboard.up('KeyD');await page.keyboard.down('KeyJ');await page.keyboard.press('KeyL');await page.keyboard.press('Space');await page.waitForTimeout(220);await page.keyboard.press('Space');await page.screenshot({path:'test-results/combat-B.png'});
  await winFight(page);await expect(page.getByRole('heading',{name:'Chiến thắng',exact:true})).toBeVisible();await expect(page.locator('.combat-dialog')).not.toContainText(/lượt|05:00|hồi|10/);const s=await fight(page);const times=s.frameTimes.slice(60).sort((a,b)=>a-b);await info.attach('combat-performance',{body:JSON.stringify({viewport:[1920,1080],dpr:1,samples:times.length,p95:times[Math.floor(times.length*.95)],fps:1000/(times.reduce((a,b)=>a+b,0)/times.length)}),contentType:'application/json'});await page.getByRole('button',{name:'Về rừng',exact:true}).click();await expect(page.locator('.combat-shell')).toHaveCount(0);expect((await world(page)).pos).toEqual(origin);await encounter(page);await expect(page.locator('.encounter-card')).toContainText('Còn 9/10 lượt chiến đấu');const ledger=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey);expect(ledger.monsters['wood-yao']).toHaveLength(1);expect(ledger.monsters['wood-yao'][0].readyAt).toBeGreaterThan(Date.now());expect(errors).toEqual([]);
});
test('recharge updates outside silently, 0/10 disables battle, other monster stays independent',async({page})=>{
  const now=Date.now();await seedForest(page,Array.from({length:10},(_,i)=>({id:`spent-${i}`,startedAt:now-300000,readyAt:now+5000+i*300000})));await enter(page);await encounter(page);await expect(page.locator('.encounter-card')).toContainText('Còn 0/10');await expect(page.locator('.encounter-card .battle-primary')).toBeDisabled();await expect(page.locator('.encounter-card')).not.toContainText(/\d\d:\d\d|hồi|phút/);await expect(page.locator('.encounter-card')).toContainText('Còn 1/10',{timeout:8000});await expect(page.locator('.encounter-card .battle-primary')).toBeEnabled();await page.getByRole('button',{name:'Đóng',exact:true}).click();await encounter(page,'spore-yao');await expect(page.locator('.encounter-card')).toContainText('Còn 10/10');
});
test('pause clears input, skill/guard/retreat work and interrupted reload keeps bag and charge',async({page})=>{
  await seedForest(page);await enter(page);await encounter(page);await begin(page);await page.keyboard.down('KeyK');await page.waitForTimeout(500);expect((await fight(page)).stamina).toBeLessThan(80);await page.keyboard.press('Escape');const before=await fight(page);await page.waitForTimeout(300);expect((await fight(page)).time).toBe(before.time);expect((await fight(page)).input).toEqual([]);await page.keyboard.up('KeyK');await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.keyboard.press('KeyL');await expect.poll(async()=>(await fight(page)).mana).toBeLessThan(65);await retreat(page);expect((await world(page)).bag.herb).toBe(2);await encounter(page);await expect(page.locator('.encounter-card')).toContainText('9/10');await begin(page);await page.reload();await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();await encounter(page);await expect(page.locator('.encounter-card')).toContainText('8/10');expect((await world(page)).bag.herb).toBe(2);const ledger=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey);expect(ledger.monsters['wood-yao'].every((e:{readyAt:number})=>typeof e.readyAt==='number')).toBe(true);
});
test('failed arena load does not spend a charge; retry enters once',async({page})=>{
  await seedForest(page);await page.route('**/combat-arena.png',route=>route.abort());await enter(page);await encounter(page);await page.locator('.encounter-card .battle-primary').click();await expect(page.getByRole('alert')).toContainText('Không tải được đấu trường');expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey)).monsters['wood-yao']).toHaveLength(0);await page.unroute('**/combat-arena.png');await begin(page);expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey)).monsters['wood-yao']).toHaveLength(1);
});
test('another tab cannot spend or recover the running encounter; spore has its own combat',async({page,context})=>{
  await seedForest(page);await enter(page);await encounter(page,'spore-yao');await begin(page);await page.screenshot({path:'test-results/combat-spore.png'});
  const second=await context.newPage();await second.setViewportSize({width:1920,height:1080});await enter(second);await mapClick(second,21,535);await expect.poll(async()=>(await world(second)).map,{timeout:15000}).toBe('forest');await encounter(second);await second.locator('.encounter-card .battle-primary').click();await expect(second.getByRole('alert')).toContainText('tab khác');const ledger=await second.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey);expect(ledger.monsters['wood-yao']).toHaveLength(0);expect(ledger.monsters['spore-yao']).toHaveLength(1);expect(ledger.monsters['spore-yao'][0].readyAt).toBeUndefined();await second.close();
});
test('storage write failure is visible and does not enter a battle or erase inventory',async({page})=>{
  await seedForest(page);await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='truc-khe.combat.v1'&&localStorage.getItem(key))throw new DOMException('quota','QuotaExceededError');return original.call(this,key,value);};});await enter(page);await encounter(page);await page.locator('.encounter-card .battle-primary').click();await expect(page.getByRole('alert')).toContainText('Không lưu được');await expect(page.locator('.combat-shell')).toHaveCount(0);expect((await world(page)).bag.herb).toBe(2);expect((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey)).monsters['wood-yao']).toHaveLength(0);
});
test('spore AI casts a real warned skill, shares stats, and can be defeated with normal controls',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1920,height:1080});await seedForest(page);await enter(page);await encounter(page,'spore-yao');await begin(page);
  expect((await fight(page)).enemyStats).toMatchObject({life:210,attack:16,magicResistance:14});
  await expect.poll(async()=>(await fight(page)).phase,{intervals:[40]}).toMatch(/^warn-/);
  await page.screenshot({path:'test-results/monster-spore-warning.png'});
  await expect.poll(async()=>(await fight(page)).hp,{timeout:12000}).toBeLessThan(120);
  expect((await fight(page)).decisions.length).toBeGreaterThan(0);
  await winFight(page);await expect(page.getByRole('heading',{name:'Chiến thắng',exact:true})).toBeVisible();await page.getByRole('button',{name:'Về rừng',exact:true}).click();await encounter(page,'spore-yao');await expect(page.locator('.encounter-card')).toContainText('Còn 9/10');expect(errors).toEqual([]);
});
test('idle player loses to actual monster AI and returns without another charge or inventory loss',async({page})=>{
  test.setTimeout(100000);await seedForest(page);await enter(page);await encounter(page);const origin=(await world(page)).pos;await begin(page);
  await expect(page.getByRole('heading',{name:'Bại trận',exact:true})).toBeVisible({timeout:85000});
  const dead=await fight(page);expect(dead.hp).toBe(0);await page.waitForTimeout(200);expect((await fight(page)).time).toBe(dead.time);await expect(page.locator('.combat-dialog')).not.toContainText(/lượt|hồi|\/10/);
  await page.getByRole('button',{name:'Về rừng',exact:true}).click();expect((await world(page)).pos).toEqual(origin);expect((await world(page)).bag.herb).toBe(2);await encounter(page);await expect(page.locator('.encounter-card')).toContainText('Còn 9/10');
});
for(const [width,height,dpr,hero] of [[1280,720,1,'B'],[1920,1080,2,'C'],[2560,1440,1,'D'],[720,900,2,'A']] as const)test(`combat B ${width}x${height} DPR${dpr} hero${hero}`,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});const page=await context.newPage();await seedForest(page,[],'en',hero);await enter(page,'en',hero);await encounter(page);await begin(page);await expect(page.getByRole('button',{name:'Spirit slash',exact:true})).toBeVisible();await expect(page.locator('.combat-shell')).not.toContainText(/remaining|recharge|\/10/);expect((await fight(page)).backing).toEqual({width:width*dpr,height:height*dpr});await page.screenshot({path:`test-results/combat-${width}-${height}-${dpr}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:900,height:700});await expect.poll(async()=>(await fight(page)).backing).toEqual({width:900*dpr,height:700*dpr});const box=(await page.getByRole('button',{name:'Right',exact:true}).boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(200);await page.mouse.move(100,300);await page.mouse.up();expect((await fight(page)).input).toEqual([]);await context.close();
});
