import {test,expect} from '@playwright/test';
import {SCENES,blocked,gateMarker} from '../../src/engine/scene';
type Snapshot={map:string;pos:{x:number;y:number};actors:Array<{id:string;x:number;y:number}>;camera:{x:number;y:number;scale:number;dpr:number};route:unknown[];visited:string[];bag:Record<string,number>;hover:string|null;fps:number;phase:number;time:number;backing:{width:number;height:number};frameTimes:number[]};
const snapshot=(page:import('@playwright/test').Page)=>page.evaluate(()=> (window as unknown as {__game:{snapshot:()=>Snapshot}}).__game.snapshot());
async function start(page:import('@playwright/test').Page){await page.goto('/?debug=1');await page.getByLabel('Tên nhân vật',{exact:true}).fill('Vân Sinh');await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();await expect(page.locator('.world-canvas')).toBeVisible();}
async function worldClick(page:import('@playwright/test').Page,x:number,y:number){const s=await snapshot(page);await page.locator('.world-canvas').click({position:{x:(x-s.camera.x)*s.camera.scale,y:(y-s.camera.y)*s.camera.scale}});}
test('name, NPC approach, Vietnamese/English, real inventory and motion settings',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  await expect(page.locator('.quest-card')).toHaveCount(0);await expect(page.locator('.location')).toHaveCount(0);await expect(page.locator('.dialogue')).toHaveCount(0);
  for(const [id,name] of [['teacher','Mục tiên sinh'],['healer','Dược sư Lạc Tố'],['smith','Thợ rèn Thiết Sơn']]){await page.getByRole('button',{name:'Nhiệm vụ',exact:true}).click();await page.getByRole('button',{name:new RegExp(name)}).click();expect((await snapshot(page)).visited).not.toContain(id);await expect.poll(async()=>(await snapshot(page)).visited,{timeout:15000}).toContain(id);}
  await expect(page.locator('.dialogue')).toContainText('Muốn rèn kiếm tốt');const current=(await snapshot(page)).pos;await worldClick(page,current.x-70,current.y+60);await expect(page.locator('.dialogue')).toHaveCount(0);
  await page.getByRole('button',{name:'Hành trang',exact:true}).click();const character=page.getByRole('dialog',{name:'Hành trang'});await expect(character.locator('.character-identity .portrait')).toBeVisible();await expect(character).toContainText('Sinh mệnh');await expect(character).toContainText('Ngộ tính');await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Ngôn ngữ').selectOption('en');await expect(page.getByRole('dialog')).toHaveAccessibleName('Settings');await page.getByLabel('Reduce motion').check();await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.locator('.map-card')).toContainText('Truc Khe Village');await expect(page.locator('.map-card')).toContainText('Nam Linh · Morning');
  await page.getByRole('button',{name:'Equipment',exact:true}).click();await expect(page.locator('.item-cell')).toHaveCount(100);await expect(page.locator('.item-cell.occupied')).toHaveCount(10);await page.keyboard.press('Escape');expect(errors).toEqual([]);
});
test('localized direction sign stays visible and highlights when hovered',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('truc-khe.motion','true'));await page.setViewportSize({width:1920,height:1080});await start(page);
  const marker=gateMarker(SCENES.village.gates[0]),clip={x:40,y:450,width:220,height:170},before=await page.screenshot({clip});await page.locator('.world-canvas').hover({position:marker});await expect.poll(async()=>(await snapshot(page)).hover).toBe('gate:forest');const active=await page.screenshot({clip});expect(active.equals(before)).toBe(false);
  await page.locator('.world-canvas').hover({position:{x:600,y:600}});await expect.poll(async()=>(await snapshot(page)).hover).toBe(null);
});
test('physical click goes around the clinic, scene animates, and live FPS is recorded',async({page},testInfo)=>{
  await page.setViewportSize({width:1920,height:1080});await start(page);await worldClick(page,330,340);await expect.poll(async()=>(await snapshot(page)).route.length,{timeout:15000}).toBe(0);await worldClick(page,800,340);const positions=[];for(let i=0;i<35;i++){await page.waitForTimeout(100);positions.push((await snapshot(page)).pos);}for(const p of positions)expect(blocked(SCENES.village,p)).toBe(false);await expect.poll(async()=>Math.abs((await snapshot(page)).pos.x-800),{timeout:10000}).toBeLessThan(2);
  await page.waitForTimeout(1500);const one=await page.locator('canvas.world-canvas').screenshot();await page.waitForTimeout(400);const two=await page.locator('canvas.world-canvas').screenshot();expect(one.equals(two)).toBe(false);await page.waitForTimeout(2000);const s=await snapshot(page);await testInfo.attach('performance',{body:JSON.stringify({fps:s.fps,frames:s.frameTimes.length,p95:s.frameTimes.sort((a,b)=>a-b)[Math.floor(s.frameTimes.length*.95)]}),contentType:'application/json'});expect(s.fps).toBeGreaterThan(40);
});
for(const [width,height,dpr] of [[1280,720,1],[1920,1080,2],[2560,1440,1],[720,900,2]])test(`viewport ${width}x${height} DPR ${dpr}`,async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});const page=await context.newPage();await start(page);const s=await snapshot(page);expect(s.backing).toEqual({width:width*dpr,height:height*dpr});const target={x:s.pos.x+70,y:s.pos.y+70};await worldClick(page,target.x,target.y);await expect.poll(async()=>Math.hypot((await snapshot(page)).pos.x-target.x,(await snapshot(page)).pos.y-target.y),{timeout:6000}).toBeLessThan(2);await page.screenshot({path:`test-results/scene-${width}-${height}-${dpr}.png`});await testInfo.attach('viewport',{body:JSON.stringify({width,height,dpr}),contentType:'application/json'});await context.close();
});
test('forest travel, single pickup, persistent bag, return and opt-in audio',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await start(page);
  const mini=page.locator('.map-card canvas');
  const mapClick=async(x:number,y:number)=>{const box=(await mini.boundingBox())!;await mini.click({position:{x:x/1920*box.width,y:y/1080*box.height}});};
  await mapClick(21,535);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('forest');
  const herb=(await snapshot(page)).actors.find((a:any)=>a.id==='herb');await mapClick(herb.x,herb.y);await expect.poll(async()=>(await snapshot(page)).bag.herb,{timeout:15000}).toBe(1);await page.waitForTimeout(500);expect((await snapshot(page)).bag.herb).toBe(1);
  await page.getByRole('button',{name:'Hành trang',exact:true}).click();await page.locator('.item-cell[data-item="herb"]').click();await expect(page.locator('.item-detail')).toContainText('Lá Thanh Tâm');await expect(page.getByRole('dialog')).toContainText('×1');await page.keyboard.press('Escape');
  await mapClick(1899,535);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('village');
  await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();expect(await page.locator('audio').evaluate((a:HTMLAudioElement)=>a.paused)).toBe(true);await page.getByLabel('Âm thanh môi trường',{exact:true}).check();await expect.poll(()=>page.locator('audio').evaluate((a:HTMLAudioElement)=>a.paused)).toBe(false);await page.getByLabel('Âm thanh môi trường',{exact:true}).uncheck();expect(await page.locator('audio').evaluate((a:HTMLAudioElement)=>a.paused)).toBe(true);
  await page.reload();await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();expect((await snapshot(page)).bag.herb).toBe(1);
});
test('live resize preserves pointer coordinates and reduced motion freezes river ripples',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await start(page);
  const river={x:158,y:160,width:40,height:55};
  const before=await page.screenshot({clip:river});await page.waitForTimeout(350);
  expect(before.equals(await page.screenshot({clip:river}))).toBe(false);
  await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Giảm chuyển động',{exact:true}).check();await page.keyboard.press('Escape');
  const frozen=await page.screenshot({clip:river});await page.waitForTimeout(350);
  expect(frozen.equals(await page.screenshot({clip:river}))).toBe(true);
  for(const [width,height] of [[720,900],[2560,1440],[1280,720]]){
    await page.setViewportSize({width,height});
    await expect.poll(async()=>(await snapshot(page)).backing).toEqual({width,height});
    const s=await snapshot(page),target={x:s.pos.x+40,y:s.pos.y+25};await worldClick(page,target.x,target.y);
    await expect.poll(async()=>Math.hypot((await snapshot(page)).pos.x-target.x,(await snapshot(page)).pos.y-target.y)).toBeLessThan(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.reload();await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();
  await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await expect(page.getByLabel('Giảm chuyển động',{exact:true})).toBeChecked();
});
test('mountain and north gates return correctly, including a resource with its front blocked',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await start(page);
  const mapClick=async(x:number,y:number)=>{const mini=page.locator('.map-card canvas'),box=(await mini.boundingBox())!;await mini.click({position:{x:x/1920*box.width,y:y/1080*box.height}});};
  await mapClick(1899,920);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('mountain');
  await mapClick(450,740);await expect.poll(async()=>(await snapshot(page)).bag.soil,{timeout:10000}).toBe(1);
  await mapClick(21,690);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('village');
  await mapClick(990,21);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('north');
  await mapClick(990,1059);await expect.poll(async()=>(await snapshot(page)).map,{timeout:15000}).toBe('village');
});
test('all five villagers walk and can be approached and spoken to in the scene',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await start(page);
  const initial=(await snapshot(page)).actors;
  await expect.poll(async()=>{
    const now=(await snapshot(page)).actors;
    return ['amoc','adao','bangi','benam','chulam'].every(id=>{
      const a=initial.find(a=>a.id===id)!,b=now.find(a=>a.id===id)!;
      return Math.hypot(a.x-b.x,a.y-b.y)>15;
    });
  },{timeout:8000}).toBe(true);
  for(const id of ['adao','amoc','chulam','benam','bangi']){
    const a=(await snapshot(page)).actors.find(a=>a.id===id)!;
    await worldClick(page,a.x,a.y-12);
    await expect.poll(async()=>(await snapshot(page)).visited,{timeout:12000}).toContain(id);
    await expect(page.locator('.dialogue strong')).toBeVisible();
  }
});
