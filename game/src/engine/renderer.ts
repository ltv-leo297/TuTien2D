import {HEIGHT,WIDTH,gateMarker,gateSignFoot,gateSignSolid,waterAt} from './scene.ts';
import type {Actor,Point,Gate,HeroId,MapId,Scene,Prop} from './scene.ts';
import type {Camera} from './camera.ts';
import type {Simulation,MovingActor} from './simulation.ts';
import type {TextKey} from '../i18n.ts';
import atlas from './atlas.json';
import frames from './sprite-frames.json';
import idleFrames from './monster-idle-frames.json';
import {MONSTER_IDS} from '../combat/monsters.ts';
import forestFrames from './forest-frames.json';
import structures from './forest-structures.json';
import {drawForestWater,drawVegetation} from './forest-environment.ts';
import effects from '../../../assets/effects/ambient-v1.json';
export type Art={environment:HTMLImageElement;terrain:HTMLImageElement;npcs:HTMLImageElement;scenery:HTMLImageElement;villagers:HTMLImageElement;signpost:HTMLImageElement;forest:HTMLImageElement;forestLandscape:HTMLImageElement;forestStructures:HTMLImageElement;forestMonsters:HTMLImageElement;forestWater:HTMLImageElement;vegetation:Record<'tree'|'bamboo'|'blossom',HTMLImageElement>;heroes:Record<HeroId,HTMLImageElement>};
export async function loadArt():Promise<Art>{
  const load=(name:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(name));img.src=`/assets/production/${name}.png`;});
  const [environment,terrain,npcs,scenery,villagers,signpost,forest,forestLandscape,forestStructures,forestMonsters,forestWater,tree,bamboo,blossom,A,B,C,D]=await Promise.all(['environment','terrain','npcs','scenery','villagers','signpost-A','forest/objects','forest/ground-v3','forest/structures-v2','forest/monsters-idle-v4','forest/water-flow-v4','forest/tree-v3','forest/bamboo-v3','forest/blossom-v3','hero-A','hero-B','hero-C','hero-D'].map(load));return {environment,terrain,npcs,scenery,villagers,signpost,forest,forestLandscape,forestStructures,forestMonsters,forestWater,vegetation:{tree,bamboo,blossom},heroes:{A,B,C,D}};
}
const rand=(n:number)=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
function cell(ctx:CanvasRenderingContext2D,img:HTMLImageElement,col:number,row:number,cols:number,rows:number,x:number,y:number,w:number,h:number){if(cols===4&&rows===3){const [sx,sy,sw,sh]=atlas.environment[row*4+col],scale=Math.min(w/sw,h/sh);w=sw*scale;h=sh*scale;ctx.drawImage(img,sx,sy,sw,sh,Math.round(x-w/2),Math.round(y-h),w,h);return;}const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;ctx.drawImage(img,col*sw,row*sh,sw,sh,Math.round(x-w/2),Math.round(y-h*.9),w,h);}
function oval(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();}
function sprite(ctx:CanvasRenderingContext2D,img:HTMLImageElement,id:keyof typeof frames,index:number,x:number,y:number,size:number){const data=frames[id],[sx,sy,sw,sh]=data.frames[index],scale=size/data.maxHeight;ctx.drawImage(img,sx,sy,sw,sh,Math.round(x-sw*scale/2),Math.round(y-sh*scale),sw*scale,sh*scale);}
export function drawHero(ctx:CanvasRenderingContext2D,art:Art,hero:HeroId,x:number,y:number,direction:number,phase:number,size=72){const column=[0,1,2,1][Math.floor(phase)%4];sprite(ctx,art.heroes[hero],`hero-${hero}`,direction*3+column,x,y,size);}
export function actorAt(actors:Actor[],point:Point){
  // Match the measured forest sprite's rendered rectangle, so the head is clickable too.
  return [...actors].sort((a,b)=>b.y-a.y).find(a=>{
    if(a.forestTile===undefined)return Math.hypot(a.x-point.x,a.y-point.y)<35;
    const row=MONSTER_IDS.indexOf(a.id as typeof MONSTER_IDS[number]),rs=idleFrames.rects.slice(row*4,row*4+4);
    const [, ,w,h]=row>=0?[0,0,Math.max(...rs.map(r=>r[2])),Math.max(...rs.map(r=>r[3]))]:forestFrames.objects.rects[a.forestTile],size=a.role==='monster'?(a.mapSize??(a.level===2?105:68)):43,k=size/Math.max(w,h);
    return point.x>=a.x-w*k/2-5&&point.x<=a.x+w*k/2+5&&point.y>=a.y-h*k-5&&point.y<=a.y+12;
  });
}
export class Renderer {
  private backgrounds=new Map<MapId,HTMLCanvasElement>();
  private forestMini:HTMLCanvasElement|undefined;
  private textures=new Map<number,HTMLCanvasElement>();
  constructor(public art:Art){}
  private texture(index:number){let canvas=this.textures.get(index);if(canvas)return canvas;canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;const img=this.art.terrain,w=img.naturalWidth/2,h=img.naturalHeight/2;c.drawImage(img,(index%2)*w,Math.floor(index/2)*h,w,h,0,0,384,384);this.textures.set(index,canvas);return canvas;}
  private ground(scene:Scene){
    const old=this.backgrounds.get(scene.id);if(old)return old;
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const c=canvas.getContext('2d')!;
    if(scene.landscape){c.imageSmoothingEnabled=false;c.drawImage(this.art.forestLandscape,0,0,WIDTH,HEIGHT);this.backgrounds.set(scene.id,canvas);return canvas;}
    c.imageSmoothingEnabled=false;c.fillStyle=scene.id==='mountain'?'#a8b89a':scene.id==='forest'?'#77b55e':'#a3d66a';c.fillRect(0,0,WIDTH,HEIGHT);
    c.globalAlpha=scene.id==='mountain'?.65:.66;c.fillStyle=c.createPattern(this.texture(scene.id==='mountain'?3:0),'repeat')!;c.fillRect(0,0,WIDTH,HEIGHT);c.globalAlpha=1;
    for(let i=0;i<4000;i++){const x=Math.floor(rand(i)*WIDTH),y=Math.floor(rand(i+17000)*HEIGHT);c.fillStyle=['#8ec754','#b2dc72','#77ba50','#c0df82'][i%4];c.globalAlpha=.4;c.fillRect(x,y,3+rand(i+8)*8,2+rand(i+9)*4);}c.globalAlpha=1;
    for(const terrace of scene.terraces??[]){
      c.fillStyle='#99c66c';c.fillRect(terrace.x,terrace.y,terrace.w,terrace.h);
      c.globalAlpha=.38;c.fillStyle=c.createPattern(this.texture(0),'repeat')!;c.fillRect(terrace.x,terrace.y,terrace.w,terrace.h);c.globalAlpha=1;
    }
    const path=new Path2D();for(const points of scene.paths){path.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length-1;i++)path.quadraticCurveTo(points[i].x,points[i].y,(points[i].x+points[i+1].x)/2,(points[i].y+points[i+1].y)/2);const end=points.at(-1)!;path.lineTo(end.x,end.y);}
    c.lineJoin='round';c.lineCap='round';c.strokeStyle='#edd19a';c.lineWidth=138;c.stroke(path);
    c.strokeStyle=c.createPattern(this.texture(1),'repeat')!;c.globalAlpha=.72;c.stroke(path);c.globalAlpha=1;
    for(let i=0;i<4500;i++){const x=rand(i+8888)*WIDTH,y=rand(i+9888)*HEIGHT;if(c.isPointInStroke(path,x,y)){c.fillStyle=i%4?'#d8c18d66':'#fff0c666';c.fillRect(x,y,3,2);}}
    for(const water of scene.water){c.fillStyle='#739f78';c.fillRect(water.x-10,water.y,water.w+20,water.h);c.fillStyle='#3caaba';c.fillRect(water.x,water.y,water.w,water.h);c.fillStyle=c.createPattern(this.texture(2),'repeat')!;c.globalAlpha=.65;c.fillRect(water.x+4,water.y,water.w-8,water.h);c.globalAlpha=1;for(let y=water.y;y<water.y+water.h;y+=18){c.fillStyle='#86ba68';c.fillRect(water.x-16,y,7+rand(y)*8,13);c.fillRect(water.x+water.w+6,y,7,10);}}
    for(const river of scene.rivers??[]){
      const water=new Path2D();river.points.forEach((p,i)=>i?water.lineTo(p.x,p.y):water.moveTo(p.x,p.y));
      c.lineCap='round';c.lineJoin='round';c.lineWidth=river.width+25;c.strokeStyle='#547f58';c.stroke(water);
      c.lineWidth=river.width+12;c.strokeStyle='#8da887';c.stroke(water);
    }
    // All banks first, then all water: connected regions must not draw a dam at their overlap.
    for(const river of scene.rivers??[]){
      const water=new Path2D();river.points.forEach((p,i)=>i?water.lineTo(p.x,p.y):water.moveTo(p.x,p.y));
      c.lineCap='round';c.lineJoin='round';c.lineWidth=river.width;c.strokeStyle='#28bed1';c.stroke(water);
      c.globalAlpha=.85;c.strokeStyle=c.createPattern(this.texture(2),'repeat')!;c.stroke(water);c.globalAlpha=1;
    }
    // Broken grass edges and small tufts keep the path from reading as a smooth vector stripe.
    for(let i=0;i<14000;i++){const x=Math.floor(rand(i+85001)*WIDTH/3)*3,y=Math.floor(rand(i+99001)*HEIGHT/3)*3;c.lineWidth=160;const edge=c.isPointInStroke(path,x,y);c.lineWidth=112;if(edge&&!c.isPointInStroke(path,x,y)&&!waterAt(scene,{x,y},15)){c.fillStyle=['#8fc957','#a9d86a','#b5dc77','#e7cb8e','#eed69f'][i%5];c.fillRect(x,y,3+Math.floor(rand(i+6)*4)*3,3+Math.floor(rand(i+8)*3)*3);}}
    if(scene.id==='forest')for(let i=0;i<600;i++){
      const x=Math.floor(rand(i+23000)*WIDTH),y=Math.floor(rand(i+24000)*HEIGHT);
      if(waterAt(scene,{x,y},25))continue;
      c.lineWidth=170;if(!c.isPointInStroke(path,x,y))continue;
      const size=4+i%7;c.fillStyle='#b7bb9e';c.fillRect(x,y,size+3,size*.65);c.fillStyle='#d9d7b5';c.fillRect(x+1,y,size,2);
    }
    c.lineWidth=130;
    for(const g of scene.gardens??[]){
      for(let row=0;row<4;row++)for(let col=0;col<2;col++){const x=g.gateX-27+col*27+(row%2)*7,y=g.y+g.h-40+row*18;c.fillStyle=row%2?'#a4ac92':'#bac2a1';c.beginPath();c.moveTo(x+4,y);c.lineTo(x+21,y-2);c.lineTo(x+25,y+8);c.lineTo(x+17,y+13);c.lineTo(x+1,y+10);c.closePath();c.fill();c.fillStyle='#dee0b4';c.fillRect(x+5,y+1,12,2);}
    }
    for(const building of scene.props.filter(p=>!p.atlas&&p.tile<4)){oval(c,building.x,building.y+22,57,36,'#d2ce9690');for(let n=0;n<6;n++){c.fillStyle=n%2?'#b7b697':'#c9c9aa';c.beginPath();c.roundRect(building.x-32+(n%3)*24,building.y+8+Math.floor(n/3)*19+(n%2)*2,19,13,5);c.fill();}}
    for(let i=0;i<90;i++){const x=70+rand(i+55)*1780,y=100+rand(i+666)*860;if(c.isPointInStroke(path,x,y)||waterAt(scene,{x,y},20))continue;cell(c,this.art.environment,2,2,4,3,x,y,24,24);}
    this.backgrounds.set(scene.id,canvas);return canvas;
  }
  draw(ctx:CanvasRenderingContext2D,sim:Simulation,camera:Camera,translate:(key:TextKey)=>string,playerName:string,reduced:boolean,debug:boolean,hover:string|null){
    const {dpr,scale}=camera;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,camera.width,camera.height);ctx.fillStyle='#183f36';ctx.fillRect(0,0,camera.width,camera.height);
    ctx.setTransform(dpr*scale,0,0,dpr*scale,-camera.x*dpr*scale,-camera.y*dpr*scale);ctx.imageSmoothingEnabled=false;
    ctx.save();ctx.beginPath();ctx.rect(0,0,WIDTH,HEIGHT);ctx.clip();
    if(sim.scene.landscape)ctx.drawImage(this.art.forestLandscape,0,0,WIDTH,HEIGHT);else ctx.drawImage(this.ground(sim.scene),0,0);const t=reduced?0:sim.time;
    if(sim.scene.landscape)drawForestWater(ctx,this.art.forestWater,t);else {this.water(ctx,sim.scene,t);this.cascades(ctx,sim.scene,t);}
    for(const p of sim.scene.props.filter(p=>p.layer==='ground'&&!sim.scene.bridges?.some(b=>b.propId===p.id)))this.prop(ctx,{...p,y:p.y+Math.sin(t*1.4+p.x)*1.5},0);
    // Draw the bridge surface below feet; its sprite must not hide a crossing actor.
    for(const bridge of sim.scene.bridges??[]){const p=sim.scene.props.find(p=>p.id===bridge.propId);if(p)this.prop(ctx,p,0);}
    if(sim.route.length){ctx.strokeStyle='#fff8d066';ctx.lineWidth=2;ctx.setLineDash([3,9]);ctx.beginPath();ctx.moveTo(sim.pos.x,sim.pos.y);sim.route.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);const end=sim.route.at(-1)!;ctx.strokeStyle='#fff9da';ctx.beginPath();ctx.ellipse(end.x,end.y,14,7,0,0,Math.PI*2);ctx.stroke();}
    const layers:Array<{y:number;draw:()=>void}>=sim.scene.props.filter(p=>p.layer!=='ground'&&!sim.scene.bridges?.some(b=>b.propId===p.id)).map(p=>({y:p.y,draw:()=>this.prop(ctx,p,t)}));
    for(const v of sim.scene.vegetation??[])layers.push({y:v.y,draw:()=>drawVegetation(ctx,this.art.vegetation[v.kind],v,t)});
    if(sim.scene.landscape){const bridge=sim.scene.props.find(p=>p.id==='forest-bridge');if(bridge)layers.push({y:bridge.y,draw:()=>{ctx.save();ctx.beginPath();ctx.rect(bridge.x-bridge.size/2,bridge.y-bridge.size*.21,bridge.size,bridge.size*.21);ctx.clip();this.prop(ctx,bridge,0);ctx.restore();}});}
    sim.actors.forEach(actor=>layers.push({y:actor.y,draw:()=>this.actor(ctx,actor,t,sim.cooldowns[actor.id]>sim.time)}));
    for(const gate of sim.scene.gates){const foot=gateSignFoot(gate);layers.push({y:foot.y,draw:()=>this.gateSign(ctx,gate,translate,hover===`gate:${gate.id}`)});}
    layers.push({y:sim.pos.y,draw:()=>{oval(ctx,sim.pos.x,sim.pos.y-1,14,5,'#294c4040');drawHero(ctx,this.art,sim.hero,sim.pos.x,sim.pos.y,sim.direction,sim.phase);}});
    layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw());
    this.ambient(ctx,sim,t,reduced);
    for(const actor of sim.actors){if(actor.role!=='monster'&&!['teacher','healer','smith'].includes(actor.id)&&hover!==actor.id&&Math.hypot(sim.pos.x-actor.x,sim.pos.y-actor.y)>90)continue;this.label(ctx,translate(actor.id as TextKey)+(actor.level?` · ${translate('world.level')} ${actor.level}`:''),actor.x,actor.y-(actor.role==='resource'?53:actor.mapSize?(actor.mapSize+8):80),scale,hover===actor.id);if(['teacher','healer','smith'].includes(actor.id)&&!sim.visited.has(actor.id)){ctx.fillStyle='#fff3a6';ctx.font='bold 19px sans-serif';ctx.textAlign='center';ctx.fillText('!',actor.x,actor.y-102+Math.sin(t*3)*3);}}
    this.label(ctx,playerName,sim.pos.x,sim.pos.y+19,scale,false);
    if(debug){ctx.strokeStyle='#ff3559';ctx.lineWidth=2;for(const r of [...sim.scene.water,...sim.scene.props.flatMap(p=>p.solid?[p.solid]:[]),...sim.scene.gates.map(gateSignSolid)])ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#5fffff';for(const b of sim.scene.bridges??[]){ctx.beginPath();b.deck.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();}ctx.beginPath();ctx.arc(sim.pos.x,sim.pos.y,10,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  private label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,scale:number,active:boolean){ctx.save();ctx.translate(x,y);ctx.scale(1/scale,1/scale);ctx.font='600 12px system-ui,sans-serif';ctx.textAlign='center';const width=ctx.measureText(text).width+16;ctx.fillStyle=active?'#173d35ed':'#173d359f';ctx.beginPath();ctx.roundRect(-width/2,-13,width,21,5);ctx.fill();ctx.fillStyle='#fff6da';ctx.fillText(text,0,1);ctx.restore();}
  private gateSign(ctx:CanvasRenderingContext2D,gate:Gate,translate:(key:TextKey)=>string,active:boolean){
    const marker=gateMarker(gate),foot=gateSignFoot(gate),pointsLeft=foot.x>gate.x+gate.w/2,size=96;
    ctx.save();ctx.translate(foot.x,foot.y);if(pointsLeft)ctx.scale(-1,1);if(active){ctx.shadowColor='#ffe59a';ctx.shadowBlur=8;}ctx.globalAlpha=active?1:.96;ctx.drawImage(this.art.signpost,-size/2,-size,size,size);ctx.restore();
    const text=translate(gate.to as TextKey),maxWidth=54;
    ctx.save();ctx.font='700 8px "Be Vietnam Pro",system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const words=text.split(' '),lines:string[]=[];for(const word of words){const candidate=lines.length?`${lines.at(-1)} ${word}`:word;if(lines.length&&ctx.measureText(candidate).width>maxWidth)lines.push(word);else if(lines.length)lines[lines.length-1]=candidate;else lines.push(word);}
    if(lines.length>2)lines.splice(1,lines.length-1,lines.slice(1).join(' '));
    const textX=marker.x+(pointsLeft?5:-5),startY=marker.y-(lines.length-1)*4.5;ctx.fillStyle='#3b2416';ctx.shadowColor='#f6cf83';ctx.shadowBlur=1;
    lines.slice(0,2).forEach((line,index)=>ctx.fillText(line,textX,startY+index*9,maxWidth));
    const arrow=gate.y<=0?'↑':gate.y+gate.h>=HEIGHT?'↓':gate.x<=0?'←':'→';ctx.font='900 10px system-ui,sans-serif';ctx.fillText(arrow,marker.x+(pointsLeft?-34:34),marker.y);
    ctx.restore();
  }
  private prop(ctx:CanvasRenderingContext2D,p:Prop,t:number){
    if(p.hidden)return;
    ctx.save();ctx.translate(p.x,p.y);if(p.flip)ctx.scale(-1,1);if(p.heightScale)ctx.scale(1,p.heightScale);if(p.sway)ctx.transform(1,0,Math.sin(t*1.7+p.x)*.012,1,0,0);
    if(p.atlas==='structures'){
      const [x,y,w,h]=structures.rects[p.tile],scale=p.size/w;
      ctx.beginPath();structures.masks[p.tile].forEach(([px,py],i)=>{const xx=(px-x-w/2)*scale,yy=(py-y-h)*scale;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.closePath();ctx.clip();
      ctx.drawImage(this.art.forestStructures,x,y,w,h,-p.size/2,-h*scale,p.size,h*scale);
    }
    else if(p.atlas==='forest'){this.forestSprite(ctx,p.tile,0,0,p.size);}
    else if(p.atlas==='scenery'){const [x,y,w,h]=atlas.scenery[p.tile],scale=p.size/Math.max(w,h),width=w*scale,height=h*scale;ctx.drawImage(this.art.scenery,x,y,w,h,-width/2,-height,width,height);}
    else cell(ctx,this.art.environment,p.tile%4,Math.floor(p.tile/4),4,3,0,0,p.size,p.size);ctx.restore();
  }
  private forestSprite(ctx:CanvasRenderingContext2D,tile:number,x:number,y:number,size:number){
    const [sx,sy,sw,sh]=forestFrames.objects.rects[tile],scale=size/Math.max(sw,sh);
    ctx.drawImage(this.art.forest,sx,sy,sw,sh,Math.round(x-sw*scale/2),Math.round(y-sh*scale),sw*scale,sh*scale);
  }
  private actor(ctx:CanvasRenderingContext2D,a:MovingActor,t:number,depleted:boolean){
    if(a.role==='npc'){oval(ctx,a.x,a.y,13,4,'#294c4040');const row={teacher:0,healer:1,smith:2}[a.id];if(row!==undefined)sprite(ctx,this.art.npcs,'npcs',row*3+Math.floor(t*(a.id==='smith'?4:1.8))%3,a.x,a.y,70);else if(a.appearance){
      const column=[0,1,2,1][Math.floor(a.phase)%4],farmer=a.appearance==='farmer';
      // The right-facing farmer's neutral source frame faces forward; mirror its left counterpart.
      if(farmer&&a.direction===2&&column===1){ctx.save();ctx.translate(a.x*2,0);ctx.scale(-1,1);sprite(ctx,this.art.villagers,'villagers',7,a.x,a.y,66);ctx.restore();}
      else sprite(ctx,this.art.villagers,'villagers',a.direction*6+(farmer?0:3)+column,a.x,a.y,farmer?66:61);
    }else drawHero(ctx,this.art,a.skin,a.x,a.y,a.direction,a.phase);return;}
    ctx.save();ctx.globalAlpha=depleted?.3:1;
    if(a.role==='monster'&&MONSTER_IDS.includes(a.id as typeof MONSTER_IDS[number])){
      const row=MONSTER_IDS.indexOf(a.id as typeof MONSTER_IDS[number]),rs=idleFrames.rects.slice(row*4,row*4+4);
      const [sx,sy,sw,sh]=rs[Math.floor(t*3+row)%4],k=(a.mapSize??68)/Math.max(...rs.map(r=>Math.max(r[2],r[3])));
      oval(ctx,a.x,a.y,23,5,'#274d3635');ctx.drawImage(this.art.forestMonsters,sx,sy,sw,sh,a.x-sw*k/2,a.y-sh*k,sw*k,sh*k);
    }else if(a.forestTile!==undefined){oval(ctx,a.x,a.y, a.role==='monster'?23:14,5,'#274d3635');this.forestSprite(ctx,a.forestTile,a.x,a.y+(a.role==='monster'?Math.sin(t*2+a.x)*2:0),a.role==='monster'?(a.mapSize??(a.level===2?105:68)):43);}
    else if(a.role==='resource')cell(ctx,this.art.environment,['ore','stone','soil'].includes(a.id)?0:2,2,4,3,a.x,a.y,40,40);
    else{const rock=a.id.includes('stone')||a.id.includes('rock');const bob=Math.sin(t*2+a.x)*3;cell(ctx,this.art.environment,rock?0:1,2,4,3,a.x,a.y+bob,65,65);ctx.fillStyle='#173630';ctx.fillRect(a.x-8,a.y-28+bob,4,5);ctx.fillRect(a.x+6,a.y-28+bob,4,5);}
    ctx.restore();
  }
  private water(ctx:CanvasRenderingContext2D,scene:Scene,t:number){
    if(scene.landscape){
      for(const river of scene.rivers??[])for(let seg=1;seg<river.points.length;seg++){
        const a=river.points[seg-1],b=river.points[seg],dx=b.x-a.x,dy=b.y-a.y;
        for(let n=0;n<4;n++){const f=(n/4+t*.11)%1,x=a.x+dx*f+(rand(seg*7+n)-.5)*river.width*.3,y=a.y+dy*f;
          ctx.fillStyle='#d6ffff60';ctx.fillRect(Math.round(x),Math.round(y),6+n*2,1.5);
        }
      }return;
    }

    for(const r of scene.water){ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();for(let i=0;i<effects.water.rippleCountPerRegion;i++){const y=r.y+((i*41+t*effects.water.speed)%r.h),x=r.x+12+rand(i+4)*(r.w-36);ctx.fillStyle=i%3?'#c5fff188':'#248da76b';ctx.fillRect(x,y,8+rand(i)*18,2);}ctx.restore();}
    for(const river of scene.rivers??[]){
      const segments=river.points.slice(1).map((b,i)=>{const a=river.points[i];return {a,b,length:Math.hypot(b.x-a.x,b.y-a.y)};}),length=segments.reduce((n,s)=>n+s.length,0);
      for(let i=0;i<70;i++){
        let progress=(i*length/70+t*18)%length;let segment=segments[0];for(const s of segments){segment=s;if(progress<=s.length)break;progress-=s.length;}
        const f=progress/segment.length,offset=(rand(i+34)-.5)*(river.width-25),x=segment.a.x+(segment.b.x-segment.a.x)*f+offset,y=segment.a.y+(segment.b.y-segment.a.y)*f;
        ctx.fillStyle=i%4?'#c2fff199':'#ecfffbd9';ctx.fillRect(x,y,7+rand(i+2)*17,2);ctx.fillRect(x+4,y+4,7,1);
      }
    }
  }
  private cascades(ctx:CanvasRenderingContext2D,scene:Scene,t:number){
    if(scene.landscape){
      for(const r of scene.cascades??[])for(let i=0;i<14;i++){
        const x=r.x+(rand(i+4)-.5)*r.w*.7,progress=(i/14+t*.72)%1;
        ctx.fillStyle=i%3?'#efffff75':'#94f6ff85';ctx.fillRect(Math.round(x),Math.round(r.y+progress*r.h),2,5+i%4*2);
      }return;
    }
    const falls=scene.id==='village'?[[180,145,64,92],[1740,180,65,74],[1835,580,64,78]]:(scene.cascades??[]).map(r=>[r.x,r.y,r.w,r.h]);
    for(const [x,y,w,h] of falls){
      // Broken vertical streams and foam follow the cascade, with no opaque rectangular plate.
      for(let column=0;column<20;column++){
        const px=Math.round(x-w/2+column*w/20),edge=Math.abs(column-9.5)/9.5;
        const top=y+Math.floor(rand(column+41)*10),length=h-edge*17;
        ctx.fillStyle=['#12bcda','#51e5ef','#b3fff4','#29cde8','#e1fff5'][column%5];
        ctx.fillRect(px,top,Math.ceil(w/20),length);
        for(let band=0;band<4;band++){
          const flow=(t*75+band*29+column*17)%length;
          ctx.fillStyle=column%3?'#e4fff5dd':'#049fcbb0';
          ctx.fillRect(px+(band%2),top+flow,2,Math.min(9+column%11,length-flow));
        }
      }
      ctx.strokeStyle='#e4fff6';ctx.lineWidth=3;
      for(let i=0;i<4;i++){
        ctx.beginPath();ctx.ellipse(x+(i%2?8:-5),y+h+4+i*4,w*.35+i*4,4+i*2,0,.05,Math.PI-.1);ctx.stroke();
      }
      for(let i=0;i<10;i++){
        const phase=(t*1.7+i/10)%1;
        ctx.fillStyle='#eafff6';ctx.fillRect(x+(rand(i+51)-.5)*(w+15),y+h-phase*19,3,3);
      }
    }
  }
  private ambient(ctx:CanvasRenderingContext2D,sim:Simulation,t:number,reduced:boolean){
    const forge=sim.scene.props.find(p=>p.id==='forge');if(forge){const k=forge.size/235,x=forge.x+effects.forge.flameOffset[0]*k,y=forge.y+effects.forge.flameOffset[1]*k*(forge.heightScale??1);oval(ctx,x,y,12+Math.sin(t*11)*2,10,'#ffaa3240');ctx.fillStyle='#f28a32';ctx.beginPath();ctx.moveTo(x-8,y+5);ctx.lineTo(x-4,y-9-Math.sin(t*12)*3);ctx.lineTo(x,y-3);ctx.lineTo(x+6,y-12+Math.sin(t*14)*3);ctx.lineTo(x+9,y+5);ctx.fill();ctx.fillStyle='#ffe78c';ctx.fillRect(x-3,y-3,5,8);for(let i=0;i<effects.forge.smokeCount;i++){const progress=(t*.35+i/effects.forge.smokeCount)%1;oval(ctx,forge.x+effects.forge.chimneyOffset[0]*k+Math.sin(progress*5)*13,forge.y+effects.forge.chimneyOffset[1]*k*(forge.heightScale??1)-progress*90,4+progress*12,5+progress*10,`rgba(226,233,220,${(1-progress)*.32})`);}ctx.fillStyle='#ffdc77';for(let i=0;i<effects.forge.sparkCount;i++){const age=(t*1.1+i/effects.forge.sparkCount)%1;ctx.fillRect(x+Math.sin(i*4)*age*12,y-age*28,2,3);}}
    if(reduced)return;
    for(let i=0;i<effects.leaves.count;i++){const x=(rand(i+56)*WIDTH+t*(8+i%5))%WIDTH,y=(rand(i+332)*HEIGHT+Math.sin(t+i)*12)%HEIGHT;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t+i));ctx.fillStyle=i%4?'#638e4090':'#f7dfacaa';ctx.fillRect(0,0,5,2);ctx.restore();}
    for(let i=0;i<effects.butterflies.count;i++){const x=420+i*210+Math.sin(t*.7+i)*24,y=650+Math.cos(t*.8+i*3)*100;const wing=2+Math.abs(Math.sin(t*12+i))*4;oval(ctx,x-wing/2,y,wing/2,3,i%2?'#fff6be':'#dfeeff');oval(ctx,x+wing/2,y,wing/2,3,i%2?'#fff6be':'#dfeeff');}
  }
  minimap(ctx:CanvasRenderingContext2D,sim:Simulation){ctx.clearRect(0,0,240,135);if(sim.map==='forest'){
    if(!this.forestMini){const mini=document.createElement('canvas');mini.width=WIDTH;mini.height=HEIGHT;const c=mini.getContext('2d')!;c.imageSmoothingEnabled=false;c.drawImage(this.ground(sim.scene),0,0);drawForestWater(c,this.art.forestWater,0);for(const v of sim.scene.vegetation??[])drawVegetation(c,this.art.vegetation[v.kind],v,0);for(const p of [...sim.scene.props].sort((a,b)=>a.y-b.y))this.prop(c,p,0);this.forestMini=mini;}
    ctx.drawImage(this.forestMini,0,0,240,135);
    for(const a of sim.actors){ctx.fillStyle=a.role==='monster'?(a.level===2?'#edbc65':'#e69772'):'#d8efaa';ctx.fillRect(a.x/8-1.5,a.y/8-1.5,3,3);}
  }else ctx.drawImage(this.ground(sim.scene),0,0,240,135);ctx.fillStyle='#4c704c';if(sim.map!=='forest')sim.scene.props.forEach(p=>{if(p.solid)ctx.fillRect(p.solid.x/8,p.solid.y/8,p.solid.w/8,p.solid.h/8);});ctx.fillStyle='#ffdc7b';sim.actors.filter(a=>a.role==='npc').forEach(a=>ctx.fillRect(a.x/8-2,a.y/8-2,4,4));oval(ctx,sim.pos.x/8,sim.pos.y/8,4,4,'#fff');}
}
