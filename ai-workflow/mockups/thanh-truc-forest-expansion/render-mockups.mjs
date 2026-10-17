// Review artifacts only. Reuses the existing runtime HUD without changing game source.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {chromium} from '../../../game/node_modules/@playwright/test/index.mjs';
const folder=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(folder,'../../..');
const labels={
 A:{gate:[96.1,55.8],monsters:[[42,26,'Mộc Yêu non · Cấp 1'],[48,22,'Bào Tử Yêu · Cấp 1'],[59.5,74,'Trúc Diệp Xà · Cấp 1'],[18,17,'Thanh Nham Thú · Cấp 2']]},
 B:{gate:[96.1,42.2],monsters:[[21.3,37,'Mộc Yêu non · Cấp 1'],[76.3,40,'Bào Tử Yêu · Cấp 1'],[81.5,29,'Trúc Diệp Xà · Cấp 1'],[14,54,'Thanh Nham Thú · Cấp 2']]},
 C:{gate:[94.8,48.5],monsters:[[12.5,33,'Mộc Yêu non · Cấp 1'],[47.5,11,'Bào Tử Yêu · Cấp 1'],[79,73,'Trúc Diệp Xà · Cấp 1'],[89,14,'Thanh Nham Thú · Cấp 2']]},
 D:{gate:[95.2,54.3],monsters:[[83.4,37,'Mộc Yêu non · Cấp 1'],[19,36,'Bào Tử Yêu · Cấp 1'],[47.3,85,'Trúc Diệp Xà · Cấp 1'],[74,18,'Thanh Nham Thú · Cấp 2']]},
 E:{gate:[96.1,50.7],monsters:[[34.8,58,'Mộc Yêu non · Cấp 1'],[35.7,45,'Bào Tử Yêu · Cấp 1'],[59.9,68,'Trúc Diệp Xà · Cấp 1'],[15,16,'Thanh Nham Thú · Cấp 2']]},
};
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const live=await browser.newPage({viewport:{width:1920,height:1080}});
 await live.addInitScript(()=>localStorage.setItem('truc-khe.combat.v1',JSON.stringify({version:1,monsters:{'wood-yao':[],'spore-yao':[]},returnTo:{map:'forest',pos:{x:820,y:465},direction:0}})));
 await live.goto(process.env.FOREST_REFERENCE_URL||'http://127.0.0.1:4174/?debug=1');
 await live.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();
 await live.waitForFunction(()=>window.__game?.snapshot().map==='forest');
 const hud=await live.locator('.game-shell').evaluate(el=>{
  const clone=el.cloneNode(true);
  clone.querySelector('.world-canvas').outerHTML='<img class="scene-art" src="SCENE_SOURCE" alt="Bố cục rừng đề xuất">';
  clone.querySelector('.map-card canvas').outerHTML='<img class="mini-art" src="SCENE_SOURCE" alt="Bản đồ minh họa">';
  clone.querySelectorAll('audio,.dialogue,.equipment-save-alert').forEach(e=>e.remove());
  return clone.outerHTML;
 });
 await writeFile(path.join(folder,'hud-template.html'),hud);
 await live.close();
 let css=await readFile(path.join(root,'game/src/style.css'),'utf8');
 css=css.replace(/^@import[^\n]+\n/,'');
 const hero=await readFile(path.join(root,'game/public/assets/production/hero-A.png'));
 css+='\n.hero-A{background-image:url(data:image/png;base64,'+hero.toString('base64')+')}';
 css+='\n.scene-art{width:1920px;height:1080px;object-fit:fill;display:block;image-rendering:pixelated}.mini-art{width:176px;height:99px;display:block;border-radius:4px}.controls-tip{font-size:11px}';
 css+='\n.monster-label{position:absolute;transform:translate(-50%,-100%);font-size:12px;font-weight:600;white-space:nowrap;padding:3px 8px;border-radius:6px;background:#163c32db;color:#fff4d6}.monster-label.rare{color:#ffe29a;border:1px solid #d7bd7277}.gate-label{position:absolute;transform:translate(-50%,-50%);color:#352719;font-size:10px;font-weight:700;line-height:1.05;text-align:center;pointer-events:none}';
 const variants=JSON.parse(await readFile(path.join(folder,'prompts.json'),'utf8')).variants;
 for(const variant of variants){
  const id=variant.id;
  if(process.env.FOREST_VARIANTS&&!process.env.FOREST_VARIANTS.includes(id))continue;
  const annotation=labels[id];
  const tags=annotation?annotation.monsters.map(([x,y,text])=>'<span class="monster-label '+(text.endsWith('2')?'rare':'')+'" style="left:'+x+'%;top:'+y+'%">'+text+'</span>').join('')+'<span class="gate-label" style="left:'+annotation.gate[0]+'%;top:'+annotation.gate[1]+'%">Làng Trúc<br>Khê</span>':'';
  const html='<!doctype html><html lang="vi"><meta charset="utf-8"><title>'+id+' — '+variant.name+'</title><style>'+css+'</style><body>'+hud.replaceAll('SCENE_SOURCE',id+'-art.png').replace('</main>',tags+'</main>')+'</body></html>';
  await writeFile(path.join(folder,id+'.html'),html);
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await page.goto(new URL(id+'.html',import.meta.url).href);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await page.screenshot({path:path.join(folder,id+'.png')});
  console.log(id+': rendered 1920×1080 with existing HUD');
  await page.close();
 }
} finally {await browser.close();}
