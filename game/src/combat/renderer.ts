import {assetUrl} from '../assets.ts';
import {groundHazards} from './geometry.ts';
import {drawProjectile,drawEruption} from './effects.ts';
import {ARENA_W,ARENA_H,FLOOR} from './simulation.ts';
import type {CombatSimulation} from './simulation.ts';
import type {HeroId} from '../engine/scene.ts';
import metadata from './frames.json';
import forestFrames from '../engine/forest-frames.json';
export type CombatArt={background:HTMLImageElement;actors:HTMLImageElement;forest:HTMLImageElement;effects:HTMLImageElement};
let cached:Promise<CombatArt>|undefined;
export function loadCombatArt(){
  if(!cached){const image=(name:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();const timer=setTimeout(()=>reject(new Error('asset')),15000);img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(new Error('asset'));};img.src=assetUrl(`assets/production/${name}.png`);});cached=Promise.all([image('combat-arena'),image('combat-actors'),image('forest/combat'),image('forest/skill-effects-v4')]).then(([background,actors,forest,effects])=>({background,actors,forest,effects})).catch(e=>{cached=undefined;throw e;});}return cached;
}
export function arenaTransform(width:number,height:number){const scale=Math.min(width/ARENA_W,height/ARENA_H);return {scale,x:(width-ARENA_W*scale)/2,y:(height-ARENA_H*scale)/2};}
export function drawCombat(ctx:CanvasRenderingContext2D,s:CombatSimulation,art:CombatArt,hero:HeroId,width:number,height:number,dpr:number,reduced:boolean){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#102f2b';ctx.fillRect(0,0,width,height);
  const camera=arenaTransform(width,height);ctx.translate(camera.x,camera.y);ctx.scale(camera.scale,camera.scale);ctx.imageSmoothingEnabled=false;
  // Source ground baseline is recorded with the production backdrop. Crop, never distort.
  const sourceScale=Math.max(ARENA_W/art.background.width,FLOOR/(art.background.height*metadata.groundRatio),(ARENA_H-FLOOR)/(art.background.height*(1-metadata.groundRatio))),bw=art.background.width*sourceScale,bh=art.background.height*sourceScale;
  ctx.save();ctx.beginPath();ctx.rect(0,0,ARENA_W,ARENA_H);ctx.clip();ctx.drawImage(art.background,(ARENA_W-bw)/2,FLOOR-bh*metadata.groundRatio,bw,bh);
  const sprite=(row:number,frame:number,x:number,y:number,face:number,size:number)=>{const [sx,sy,sw,sh]=metadata.rows[row][frame];const scale=size/metadata.rowHeights[row];ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(face,1);ctx.drawImage(art.actors,sx,sy,sw,sh,-metadata.pivots[row][frame]*scale,-sh*scale,sw*scale,sh*scale);ctx.restore();};
  const shadow=(x:number,y:number,r:number)=>{ctx.fillStyle='#16393260';ctx.beginPath();ctx.ellipse(x,y,r,6,0,0,Math.PI*2);ctx.fill();};
  shadow(s.x,FLOOR,24);shadow(s.enemyX,FLOOR,25);
  const cast=s.cast,color=s.definition.art.color;
  if(cast){
    const k=cast.skill,warning=s.enemyPhase.startsWith('warn');
    ctx.strokeStyle='#ffe786';ctx.lineWidth=4;ctx.shadowColor='#402613';ctx.shadowBlur=2;ctx.setLineDash(warning?[8,7]:[]);
    if(k.kind==='ground'){
      if(warning&&k.pattern==='wave'){
        const end=cast.x+cast.face*k.travel!;
        ctx.fillStyle='#753f2870';ctx.fillRect(Math.min(cast.x,end)-k.radius,FLOOR-k.height,Math.abs(end-cast.x)+k.radius*2,k.height);
        ctx.strokeRect(Math.min(cast.x,end)-k.radius,FLOOR-k.height,Math.abs(end-cast.x)+k.radius*2,k.height);
      }else for(const h of groundHazards(cast,warning)){
        ctx.fillStyle=warning?'#753f2870':h.active?`${color}35`:'#753f2850';
        ctx.fillRect(h.x-h.radius,FLOOR-h.height,h.radius*2,h.height);
        ctx.strokeRect(h.x-h.radius,FLOOR-h.height,h.radius*2,h.height);
        if(h.active)drawEruption(ctx,art.effects,k.visual,h.x,FLOOR,h.radius,h.height,h.progress);
        else {ctx.fillStyle='#ffe29d';ctx.fillRect(h.x-3,FLOOR-9,6,7);}
      }
    }else if(k.kind==='melee'||k.kind==='dash'){
      const start=k.kind==='dash'?cast.x: s.enemyX;
      const reach=k.kind==='dash'?Math.abs(Math.max(90,Math.min(ARENA_W-90,cast.x+cast.face*k.travel!))-cast.x)+k.radius:k.radius;
      const left=k.kind==='dash'&&!warning?s.enemyX-k.radius:cast.face>0?start-(k.kind==='dash'?k.radius:20):start-reach;
      const width=k.kind==='dash'&&!warning?k.radius*2:reach+(k.kind==='dash'?k.radius:20);
      ctx.fillStyle=warning?'#753f2870':`${color}60`;ctx.fillRect(left,FLOOR-k.height,width,k.height);ctx.strokeRect(left,FLOOR-k.height,width,k.height);
      if(!warning){
        if(k.kind==='dash'){drawEruption(ctx,art.effects,k.visual,s.enemyX-cast.face*k.radius*.5,FLOOR,k.radius*.65,k.height*.65,cast.elapsed/k.duration);}
        else {ctx.save();ctx.translate(s.enemyX,FLOOR-k.height*.45);ctx.scale(cast.face,1);ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,k.radius,k.height*.45,0,-1.2,1.2);ctx.stroke();ctx.restore();}
      }
      ctx.setLineDash([]);const arrowX=start+cast.face*reach;ctx.beginPath();ctx.moveTo(arrowX-cast.face*15,FLOOR-28);ctx.lineTo(arrowX,FLOOR-16);ctx.lineTo(arrowX-cast.face*15,FLOOR-4);ctx.stroke();
    }else if(warning){
      for(let i=0;i<(k.spread? k.count!:1);i++){
        const angle=cast.angle+(k.spread?(i/(k.count!-1)-.5)*k.spread:0),x=s.enemyX+cast.face*30,y=FLOOR-34;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*520,y+Math.sin(angle)*520);ctx.stroke();
        ctx.fillStyle='#ffe29d';for(let n=1;n<=3;n++)ctx.fillRect(x+Math.cos(angle)*n*95-4,y+Math.sin(angle)*n*95-4,8,8);
      }
    }
    ctx.setLineDash([]);ctx.shadowBlur=0;
  }
  const eframe=s.enemyAttack>0?(cast?.skill.kind==='ground'?3:4):s.enemyPhase.startsWith('warn')?5:s.enemyMoving&&!reduced?1+Math.floor(s.time*6)%2:0;
  if(s.definition.art.sheet==='forest'){
    const row=s.definition.art.row,rects=forestFrames.combat.rects.slice(row*6,row*6+6),[sx,sy,sw,sh]=rects[eframe],scale=s.definition.art.size/Math.max(...rects.map(r=>r[3]));
    ctx.save();ctx.translate(Math.round(s.enemyX),FLOOR);ctx.scale(s.enemyFace,1);ctx.drawImage(art.forest,sx,sy,sw,sh,-sw*scale/2,-sh*scale,sw*scale,sh*scale);ctx.restore();
  }else sprite(s.definition.art.row,eframe,s.enemyX,FLOOR,s.enemyFace,s.definition.art.size);
  const hframe=s.hurt>0||s.guarding?5:s.attack>0?4:s.y<FLOOR-1?3:s.moving?1+Math.floor(s.time*10)%2:0;
  ctx.globalAlpha=s.invulnerable>.2&&!reduced&&Math.floor(s.time*15)%2?.45:1;sprite('ABCD'.indexOf(hero),hframe,s.x,s.y,s.face,94);ctx.globalAlpha=1;
  if(s.guarding){ctx.strokeStyle='#9fe7e9';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(s.x+s.face*27,s.y-38,13,35,0,0,Math.PI*2);ctx.stroke();}
  if(s.attack>0){ctx.save();ctx.translate(s.x,s.y-40);ctx.scale(s.face,1);ctx.strokeStyle='#9cf9ee';ctx.lineWidth=6;ctx.beginPath();ctx.arc(5,0,67,-1.2,1.2);ctx.stroke();ctx.restore();}
  if(s.dash>0&&!reduced){ctx.fillStyle='#b5ffe478';for(let i=1;i<4;i++)ctx.fillRect(s.x-s.face*i*25-12,s.y-50,22,3);}
  if(s.slowed>0){ctx.strokeStyle='#a8df71';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(s.x,s.y-4,25,7,0,0,Math.PI*2);ctx.stroke();}
  for(const shot of s.shots){
    if(!shot.friendly){drawProjectile(ctx,art.effects,shot.visual??'seed',shot.x,shot.y,shot.r,Math.atan2(shot.vy,shot.vx));continue;}
    ctx.fillStyle='#a7fff1';ctx.strokeStyle='#37ada1';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(shot.x,shot.y,shot.r*1.6,shot.r*.65,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  if(!reduced){for(const spark of s.sparks){ctx.fillStyle=spark.color;ctx.globalAlpha=spark.life/.3;for(let i=0;i<6;i++){const a=i*Math.PI/3,r=(.3-spark.life)*100;ctx.fillRect(spark.x+Math.cos(a)*r,spark.y+Math.sin(a)*r,5,5);}}ctx.globalAlpha=1;for(let i=0;i<10;i++){const x=(i*137+s.time*14)%ARENA_W,y=100+(i*57+s.time*18)%340;ctx.fillStyle='#badd76a0';ctx.fillRect(x,y,6,3);}}
  ctx.restore();
}
