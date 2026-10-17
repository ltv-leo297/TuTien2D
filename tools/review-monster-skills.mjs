// Deterministic visual fixture of the real simulation/renderer; requires the Vite dev server.
// No fixture controls are shipped in the game or exposed through window.__combat.
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(path.join(root,'game/package.json'))('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4174/');
  await page.evaluate(async()=>{
    const {MONSTERS}=await import('/src/combat/monsters.ts');
    const {CombatSimulation}=await import('/src/combat/simulation.ts');
    const {drawCombat,loadCombatArt}=await import('/src/combat/renderer.ts');
    const art=await loadCombatArt();document.body.replaceChildren();
    Object.assign(document.body.style,{margin:'0',display:'grid',gridTemplateColumns:'1fr 1fr',background:'#102f2b',overflow:'auto'});
    for(const [id,monster] of Object.entries(MONSTERS))for(const skill of monster.skills){
      const s=new CombatSimulation(id,{seed:14});s.enemyX=900;s.x=s.enemyX-(skill.kind==='melee'?90:skill.kind==='dash'?220:300);s.enemyTimer=0;
      for(const other of monster.skills)if(other.id!==skill.id)s.cooldowns[other.id]=999;
      s.update(1/120);if(s.cast?.skill.id!==skill.id)throw new Error(`Fixture failed: ${skill.id}`);
      for(const phase of ['warning','active']){
        if(phase==='active'){const duration=s.enemyTimer+(skill.pattern==='wave'?.45:skill.pattern==='sequence'?.4:.06);for(let i=0;i<duration*120;i++)s.update(1/120);}
        const card=document.createElement('section'),label=document.createElement('div'),canvas=document.createElement('canvas');
        card.dataset.monster=id;label.textContent=`${monster.name.vi} · ${skill.name.vi} · ${phase}`;Object.assign(label.style,{font:'16px sans-serif',color:'#fff5d8',padding:'8px'});
        canvas.width=640;canvas.height=360;canvas.style.display='block';card.append(label,canvas);document.body.append(card);
        drawCombat(canvas.getContext('2d'),s,art,'A',640,360,1,true);
      }
    }
  });
  await page.screenshot({path:path.join(root,process.argv[2]??'ai-workflow/reports/monster-skills-2026-10-15.png'),fullPage:true});
  for(const id of ['wood-yao','spore-yao','bamboo-serpent','jade-beast']){const cards=page.locator(`section[data-monster="${id}"]`);const first=await cards.first().boundingBox(),last=await cards.last().boundingBox();await page.screenshot({path:path.join(root,`ai-workflow/reports/forest-rebuild-${id}-skills.png`),fullPage:true,clip:{x:0,y:first.y,width:1280,height:last.y+last.height-first.y}});}
  console.log('Rendered catalog skills, warning + active, reduced effects enabled.');
}finally{await browser.close();}
