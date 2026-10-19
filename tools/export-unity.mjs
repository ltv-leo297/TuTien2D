// Reproducible transfer of the current web game's data and measured artwork.
// Run after npm ci in game/. No source game files are changed.
import {chromium} from '../game/node_modules/playwright/index.mjs';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'unity/Assets/TrucKhe/Resources');
await mkdir(target+'/Data',{recursive:true});
await mkdir(target+'/Art/Baked',{recursive:true});
await cp(root+'/game/public/assets/production',target+'/Art/Production',{recursive:true});
await mkdir(root+'/unity/Tools',{recursive:true});
await cp(root+'/tools/export-web-save.js',root+'/unity/Tools/export-web-save.js');
const port=4197,url=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,[root+'/game/node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root+'/game',stdio:'pipe'});
let serverError='';server.stderr.on('data',s=>serverError+=s);
let browser;
try{
 for(let n=0;;n++){try{if((await fetch(url)).ok)break;}catch{}if(n>100)throw Error(serverError||'Vite startup timed out');await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage();await page.goto(url);
 const result=await page.evaluate(async()=>{
  const [world,items,monsters,stats,render,env,nav,combat]=await Promise.all([
   import('/src/engine/scene.ts'),import('/src/items/catalog.ts'),import('/src/combat/monsters.ts'),import('/src/combat/stats.ts'),import('/src/engine/renderer.ts'),import('/src/engine/forest-environment.ts'),import('/src/engine/navigation.ts'),import('/src/combat/simulation.ts')]);
  const art=await render.loadArt(),renderer=new render.Renderer(art),images={};
  for(const [id,scene] of Object.entries(world.SCENES)){
   images['ground-'+id]=renderer.ground(scene).toDataURL('image/png');
   const mini=document.createElement('canvas');mini.width=240;mini.height=135;
   renderer.minimap(mini.getContext('2d'),{map:id,scene,pos:{x:-10000,y:-10000},actors:[]});images['minimap-'+id]=mini.toDataURL('image/png');
  }
  for(let i=0;i<4;i++){
   const c=document.createElement('canvas');c.width=1920;c.height=1080;env.drawForestWater(c.getContext('2d'),art.forestWater,i/6);images['forest-water-'+i]=c.toDataURL('image/png');
  }
  const structures=(await import('/src/engine/forest-structures.json')).default;
  for(let i=0;i<structures.rects.length;i++){
   const [x,y,w,h]=structures.rects[i],c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.beginPath();structures.masks[i].forEach(([px,py],j)=>j?g.lineTo(px-x,py-y):g.moveTo(px-x,py-y));g.closePath();g.clip();g.drawImage(art.forestStructures,x,y,w,h,0,0,w,h);images['structure-'+i]=c.toDataURL('image/png');
  }
  const navigation=[];
  for(const scene of Object.values(world.SCENES)){
   for(const actor of scene.actors)navigation.push({map:scene.id,start:scene.spawn,goal:{x:actor.x,y:actor.y+42},route:nav.findPath(scene,scene.spawn,{x:actor.x,y:actor.y+42})});
   for(const gate of scene.gates)navigation.push({map:scene.id,start:scene.spawn,goal:{x:gate.x+gate.w/2,y:gate.y+gate.h/2},route:nav.findPath(scene,scene.spawn,{x:gate.x+gate.w/2,y:gate.y+gate.h/2})});
  }
  const combats=[];
  for(const id of monsters.MONSTER_IDS)for(const seed of [1,73,912]){
   const sim=new combat.CombatSimulation(id,{seed});const snapshots=[];
   for(let i=0;i<1200;i++){
    if(i===0)sim.press('right');if(i===160){sim.release('right');sim.press('attack');}
    if(i===240)sim.press('skill');if(i===241)sim.release('skill');
    if(i===300||i===330)sim.press('jump');if(i===301||i===331)sim.release('jump');
    if(i===460)sim.press('dash');if(i===461)sim.release('dash');
    if(i===600){sim.release('attack');sim.press('guard');}if(i===720){sim.release('guard');sim.press('attack');}
    sim.update(1/120);if(i%120===119)snapshots.push(sim.snapshot());
   }
   combats.push({id,seed,snapshots});
  }
  return {data:{scenes:world.SCENES,monsters:monsters.MONSTERS,monsterIds:monsters.MONSTER_IDS,items:items.ITEMS,slots:items.SLOTS,starterItems:items.STARTER_ITEMS,playerStats:stats.PLAYER_STATS},images,fixtures:{navigation,combats}};
 });
 for(const [name,url] of Object.entries(result.images))await writeFile(`${target}/Art/Baked/${name}.png`,Buffer.from(url.split(',')[1],'base64'));
 for(const [name,source] of Object.entries({atlas:'engine/atlas.json',spriteFrames:'engine/sprite-frames.json',forestFrames:'engine/forest-frames.json',idleFrames:'engine/monster-idle-frames.json',vegetation:'engine/forest-vegetation.json',combatFrames:'combat/frames.json',effectFrames:'combat/effect-frames.json',ambient:'../../assets/effects/ambient-v1.json'}))result.data[name]=JSON.parse(await readFile(path.join(root,'game/src',source),'utf8'));
 result.data.locales={};for(const lang of ['vi','en'])result.data.locales[lang]=JSON.parse(await readFile(`${root}/game/src/locales/${lang}.json`,'utf8'));
 // Storage hints refer to the native device, not a browser tab.
 Object.assign(result.data.locales.vi,{'equipment.saveHint':'Số xanh là bonus đang đeo · Lưu trên thiết bị này.','combat.saveError':'Không lưu được tiến trình chiến đấu. Hãy thử lại.','combat.busy':'Một phiên game khác đang dùng dữ liệu lưu này.','unity.saveError':'Không thể đọc hoặc ghi dữ liệu. Bản lưu hiện tại được giữ nguyên.','unity.import':'Nhập bản lưu web','unity.importHint':'Đặt web-save.json trong thư mục dữ liệu để nhập.','unity.importDone':'Đã nhập bản lưu.','unity.importMissing':'Chưa tìm thấy web-save.json.','unity.quit':'Thoát game'});
 Object.assign(result.data.locales.en,{'equipment.saveHint':'Green numbers are equipped bonuses · Saved on this device.','combat.saveError':'Cannot save combat progress. Please try again.','combat.busy':'Another game instance is using this save.','unity.saveError':'Cannot read or write progress. The existing save is preserved.','unity.import':'Import web save','unity.importHint':'Place web-save.json in the data folder to import.','unity.importDone':'Save imported.','unity.importMissing':'web-save.json was not found.','unity.quit':'Quit game'});
 await writeFile(target+'/Data/content.json',JSON.stringify(result.data));
 await mkdir(root+'/unity/Validation',{recursive:true});
 await writeFile(root+'/unity/Validation/web-fixtures.json',JSON.stringify(result.fixtures));
 const sources={};
 async function hashTree(dir){for(const f of await readdir(root+'/'+dir,{withFileTypes:true})){const relative=dir+'/'+f.name;if(f.isDirectory())await hashTree(relative);else if(!f.name.endsWith('.DS_Store'))sources[relative]=createHash('sha256').update(await readFile(root+'/'+relative)).digest('hex');}}
 await hashTree('game/src');await hashTree('game/public/assets/production');
 await writeFile(target+'/Data/provenance.json',JSON.stringify({generator:'tools/export-unity.mjs',sources},null,2)+'\n');
 console.log(`Exported ${Object.keys(result.data.scenes).length} maps, ${result.data.monsterIds.length} monsters, ${result.data.items.length} items, ${Object.keys(result.images).length} baked layers.`);
}finally{await browser?.close();server.kill();}
