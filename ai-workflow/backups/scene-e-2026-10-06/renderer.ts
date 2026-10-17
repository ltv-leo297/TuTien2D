import {HEIGHT,WIDTH,waterAt} from './scene.ts';
import type {HeroId,MapId,Scene,Prop} from './scene.ts';
import type {Camera} from './camera.ts';
import type {Simulation,MovingActor} from './simulation.ts';
import type {TextKey} from '../i18n.ts';
import atlas from './atlas.json';
import frames from './sprite-frames.json';
import effects from '../../../assets/effects/ambient-v1.json';
export type Art={environment:HTMLImageElement;terrain:HTMLImageElement;npcs:HTMLImageElement;scenery:HTMLImageElement;villagers:HTMLImageElement;heroes:Record<HeroId,HTMLImageElement>};
export async function loadArt():Promise<Art>{
  const load=(name:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(name));img.src=`/assets/production/${name}.png`;});
  const [environment,terrain,npcs,scenery,villagers,A,B,C,D]=await Promise.all(['environment','terrain','npcs','scenery','villagers','hero-A','hero-B','hero-C','hero-D'].map(load));return {environment,terrain,npcs,scenery,villagers,heroes:{A,B,C,D}};
}
const rand=(n:number)=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
function cell(ctx:CanvasRenderingContext2D,img:HTMLImageElement,col:number,row:number,cols:number,rows:number,x:number,y:number,w:number,h:number){if(cols===4&&rows===3){const [sx,sy,sw,sh]=atlas.environment[row*4+col],scale=Math.min(w/sw,h/sh);w=sw*scale;h=sh*scale;ctx.drawImage(img,sx,sy,sw,sh,Math.round(x-w/2),Math.round(y-h),w,h);return;}const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;ctx.drawImage(img,col*sw,row*sh,sw,sh,Math.round(x-w/2),Math.round(y-h*.9),w,h);}
function oval(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();}
function sprite(ctx:CanvasRenderingContext2D,img:HTMLImageElement,id:keyof typeof frames,index:number,x:number,y:number,size:number){const data=frames[id],[sx,sy,sw,sh]=data.frames[index],scale=size/data.maxHeight;ctx.drawImage(img,sx,sy,sw,sh,Math.round(x-sw*scale/2),Math.round(y-sh*scale),sw*scale,sh*scale);}
export function drawHero(ctx:CanvasRenderingContext2D,art:Art,hero:HeroId,x:number,y:number,direction:number,phase:number,size=52){const column=[0,1,2,1][Math.floor(phase)%4];sprite(ctx,art.heroes[hero],`hero-${hero}`,direction*3+column,x,y,size);}
export class Renderer {
  private backgrounds=new Map<MapId,HTMLCanvasElement>();
  private textures=new Map<number,HTMLCanvasElement>();
  constructor(public art:Art){}
  private texture(index:number){let canvas=this.textures.get(index);if(canvas)return canvas;canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;const img=this.art.terrain,w=img.naturalWidth/2,h=img.naturalHeight/2;c.drawImage(img,(index%2)*w,Math.floor(index/2)*h,w,h,0,0,384,384);this.textures.set(index,canvas);return canvas;}
  private ground(scene:Scene){
    const old=this.backgrounds.get(scene.id);if(old)return old;
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const c=canvas.getContext('2d')!;
    c.imageSmoothingEnabled=false;c.fillStyle=scene.id==='mountain'?'#a8b89a':scene.id==='forest'?'#77b55e':'#a5d779';c.fillRect(0,0,WIDTH,HEIGHT);
    c.globalAlpha=scene.id==='mountain'?.65:.38;c.fillStyle=c.createPattern(this.texture(scene.id==='mountain'?3:0),'repeat')!;c.fillRect(0,0,WIDTH,HEIGHT);c.globalAlpha=1;
    for(let i=0;i<14000;i++){const x=Math.floor(rand(i)*WIDTH),y=Math.floor(rand(i+17000)*HEIGHT);c.fillStyle=['#91c965','#b2dc83','#7cb759','#c0e494'][i%4];c.globalAlpha=.4;c.fillRect(x,y,2+rand(i+8)*5,2+rand(i+9)*3);}c.globalAlpha=1;
    const path=new Path2D();for(const points of scene.paths){path.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length-1;i++)path.quadraticCurveTo(points[i].x,points[i].y,(points[i].x+points[i+1].x)/2,(points[i].y+points[i+1].y)/2);const end=points.at(-1)!;path.lineTo(end.x,end.y);}
    c.lineJoin='round';c.lineCap='round';c.strokeStyle='#c8ca83';c.lineWidth=146;c.stroke(path);c.strokeStyle='#e8d49c';c.lineWidth=130;c.stroke(path);c.strokeStyle='#eddbab';c.lineWidth=104;c.stroke(path);
    c.strokeStyle=c.createPattern(this.texture(1),'repeat')!;c.globalAlpha=.48;c.lineWidth=126;c.stroke(path);c.globalAlpha=1;
    for(let i=0;i<4500;i++){const x=rand(i+8888)*WIDTH,y=rand(i+9888)*HEIGHT;if(c.isPointInStroke(path,x,y)){c.fillStyle=i%4?'#d8c18d66':'#fff0c666';c.fillRect(x,y,3,2);}}
    for(const water of scene.water){c.fillStyle='#739f78';c.fillRect(water.x-10,water.y,water.w+20,water.h);c.fillStyle='#3caaba';c.fillRect(water.x,water.y,water.w,water.h);c.fillStyle=c.createPattern(this.texture(2),'repeat')!;c.globalAlpha=.65;c.fillRect(water.x+4,water.y,water.w-8,water.h);c.globalAlpha=1;for(let y=water.y;y<water.y+water.h;y+=18){c.fillStyle='#86ba68';c.fillRect(water.x-16,y,7+rand(y)*8,13);c.fillRect(water.x+water.w+6,y,7,10);}}
    for(const river of scene.rivers??[]){
      const water=new Path2D();river.points.forEach((p,i)=>i?water.lineTo(p.x,p.y):water.moveTo(p.x,p.y));
      c.lineCap='round';c.lineJoin='round';c.lineWidth=river.width+25;c.strokeStyle='#547f58';c.stroke(water);
      c.lineWidth=river.width+12;c.strokeStyle='#8da887';c.stroke(water);c.lineWidth=river.width;c.strokeStyle='#28bed1';c.stroke(water);
      c.globalAlpha=.58;c.strokeStyle=c.createPattern(this.texture(2),'repeat')!;c.stroke(water);c.globalAlpha=1;
    }
    for(const g of scene.gardens??[]){
      oval(c,g.x+g.w/2,g.y+g.h-45,g.w*.46,57,'#c4d87c88');
    }
    // Broken grass edges and small tufts keep the path from reading as a smooth vector stripe.
    for(let i=0;i<2100;i++){const x=rand(i+85001)*WIDTH,y=rand(i+99001)*HEIGHT;c.lineWidth=150;const edge=c.isPointInStroke(path,x,y);c.lineWidth=112;if(edge&&!c.isPointInStroke(path,x,y)&&!waterAt(scene,{x,y},15)){c.fillStyle=i%3?'#88c259':'#aad575';c.fillRect(x,y,4+rand(i+6)*12,3+rand(i+8)*7);}}
    c.lineWidth=130;
    for(const g of scene.gardens??[]){
      for(let row=0;row<5;row++)for(let col=0;col<3;col++){const x=g.gateX-29+col*22+(row%2)*3,y=g.y+g.h-55+row*16;c.fillStyle=row%2?'#a6af91':'#bfc5a2';c.beginPath();c.roundRect(x,y,18,11,4);c.fill();c.fillStyle='#dce0bb';c.fillRect(x+3,y+2,10,2);}
    }
    for(const building of scene.props.filter(p=>!p.atlas&&p.tile<4)){oval(c,building.x,building.y+22,57,36,'#d2ce9690');for(let n=0;n<6;n++){c.fillStyle=n%2?'#b7b697':'#c9c9aa';c.beginPath();c.roundRect(building.x-32+(n%3)*24,building.y+8+Math.floor(n/3)*19+(n%2)*2,19,13,5);c.fill();}}
    for(let i=0;i<90;i++){const x=70+rand(i+55)*1780,y=100+rand(i+666)*860;if(c.isPointInStroke(path,x,y)||waterAt(scene,{x,y},20))continue;cell(c,this.art.environment,2,2,4,3,x,y,24,24);}
    this.backgrounds.set(scene.id,canvas);return canvas;
  }
  draw(ctx:CanvasRenderingContext2D,sim:Simulation,camera:Camera,translate:(key:TextKey)=>string,playerName:string,reduced:boolean,debug:boolean,hover:string|null){
    const {dpr,scale}=camera;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,camera.width,camera.height);ctx.fillStyle='#183f36';ctx.fillRect(0,0,camera.width,camera.height);
    ctx.setTransform(dpr*scale,0,0,dpr*scale,-camera.x*dpr*scale,-camera.y*dpr*scale);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.ground(sim.scene),0,0);const t=reduced?0:sim.time;
    this.water(ctx,sim.scene,t);
    for(const p of sim.scene.props.filter(p=>p.layer==='ground'))this.prop(ctx,{...p,y:p.y+Math.sin(t*1.4+p.x)*1.5},0);
    // Draw the bridge surface below feet; its sprite must not hide a crossing actor.
    for(const bridge of sim.scene.bridges??[]){const p=sim.scene.props.find(p=>p.id===bridge.propId);if(p)this.prop(ctx,p,0);}
    if(sim.route.length){ctx.strokeStyle='#fff8d066';ctx.lineWidth=2;ctx.setLineDash([3,9]);ctx.beginPath();ctx.moveTo(sim.pos.x,sim.pos.y);sim.route.forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);const end=sim.route.at(-1)!;ctx.strokeStyle='#fff9da';ctx.beginPath();ctx.ellipse(end.x,end.y,14,7,0,0,Math.PI*2);ctx.stroke();}
    const layers:Array<{y:number;draw:()=>void}>=sim.scene.props.filter(p=>p.layer!=='ground'&&!sim.scene.bridges?.some(b=>b.propId===p.id)).map(p=>({y:p.y,draw:()=>this.prop(ctx,p,t)}));
    sim.actors.forEach(actor=>layers.push({y:actor.y,draw:()=>this.actor(ctx,actor,t,sim.cooldowns[actor.id]>sim.time)}));
    layers.push({y:sim.pos.y,draw:()=>{oval(ctx,sim.pos.x,sim.pos.y-1,14,5,'#294c4040');drawHero(ctx,this.art,sim.hero,sim.pos.x,sim.pos.y,sim.direction,sim.phase);}});
    layers.sort((a,b)=>a.y-b.y).forEach(layer=>layer.draw());
    this.ambient(ctx,sim,t,reduced);
    for(const actor of sim.actors){if(!['teacher','healer','smith'].includes(actor.id)&&hover!==actor.id&&Math.hypot(sim.pos.x-actor.x,sim.pos.y-actor.y)>90)continue;this.label(ctx,translate(actor.id as TextKey),actor.x,actor.y-60,scale,hover===actor.id);if(['teacher','healer','smith'].includes(actor.id)&&!sim.visited.has(actor.id)){ctx.fillStyle='#fff3a6';ctx.font='bold 19px sans-serif';ctx.textAlign='center';ctx.fillText('!',actor.x,actor.y-82+Math.sin(t*3)*3);}}
    this.label(ctx,playerName,sim.pos.x,sim.pos.y+19,scale,false);
    for(const gate of sim.scene.gates){const x=Math.max(100,Math.min(WIDTH-100,gate.x+gate.w/2));const y=gate.y<50?120:gate.y>1000?1010:gate.y+gate.h/2-40;this.label(ctx,translate(`gate.${gate.id}` as TextKey),x,y,scale,true);}
    if(debug){ctx.strokeStyle='#ff3559';ctx.lineWidth=2;for(const r of [...sim.scene.water,...sim.scene.props.flatMap(p=>p.solid?[p.solid]:[])])ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#5fffff';for(const b of sim.scene.bridges??[]){ctx.beginPath();b.deck.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();}ctx.beginPath();ctx.arc(sim.pos.x,sim.pos.y,10,0,Math.PI*2);ctx.stroke();}
  }
  private label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,scale:number,active:boolean){ctx.save();ctx.translate(x,y);ctx.scale(1/scale,1/scale);ctx.font='600 12px system-ui,sans-serif';ctx.textAlign='center';const width=ctx.measureText(text).width+16;ctx.fillStyle=active?'#173d35ed':'#173d359f';ctx.beginPath();ctx.roundRect(-width/2,-13,width,21,5);ctx.fill();ctx.fillStyle='#fff6da';ctx.fillText(text,0,1);ctx.restore();}
  private prop(ctx:CanvasRenderingContext2D,p:Prop,t:number){
    ctx.save();ctx.translate(p.x,p.y);if(p.sway)ctx.transform(1,0,Math.sin(t*1.7+p.x)*.012,1,0,0);
    if(p.atlas==='scenery'){const [x,y,w,h]=atlas.scenery[p.tile],scale=p.size/Math.max(w,h),width=p.id.startsWith('fence-side')?28:w*scale,height=p.id.startsWith('fence-side')?55:h*scale;ctx.drawImage(this.art.scenery,x,y,w,h,-width/2,-height,width,height);}
    else cell(ctx,this.art.environment,p.tile%4,Math.floor(p.tile/4),4,3,0,0,p.size,p.size);ctx.restore();
  }
  private actor(ctx:CanvasRenderingContext2D,a:MovingActor,t:number,depleted:boolean){
    if(a.role==='npc'){oval(ctx,a.x,a.y,13,4,'#294c4040');const row={teacher:0,healer:1,smith:2}[a.id];if(row!==undefined)sprite(ctx,this.art.npcs,'npcs',row*3+Math.floor(t*(a.id==='smith'?4:1.8))%3,a.x,a.y,52);else if(a.appearance){
      const column=[0,1,2,1][Math.floor(a.phase)%4],farmer=a.appearance==='farmer';
      // The right-facing farmer's neutral source frame faces forward; mirror its left counterpart.
      if(farmer&&a.direction===2&&column===1){ctx.save();ctx.translate(a.x*2,0);ctx.scale(-1,1);sprite(ctx,this.art.villagers,'villagers',7,a.x,a.y,48);ctx.restore();}
      else sprite(ctx,this.art.villagers,'villagers',a.direction*6+(farmer?0:3)+column,a.x,a.y,farmer?48:42);
    }else drawHero(ctx,this.art,a.skin,a.x,a.y,a.direction,a.phase);return;}
    ctx.save();ctx.globalAlpha=depleted?.3:1;
    if(a.role==='resource')cell(ctx,this.art.environment,['ore','stone','soil'].includes(a.id)?0:2,2,4,3,a.x,a.y,40,40);
    else{const rock=a.id.includes('stone')||a.id.includes('rock');const bob=Math.sin(t*2+a.x)*3;cell(ctx,this.art.environment,rock?0:1,2,4,3,a.x,a.y+bob,65,65);ctx.fillStyle='#173630';ctx.fillRect(a.x-8,a.y-28+bob,4,5);ctx.fillRect(a.x+6,a.y-28+bob,4,5);}
    ctx.restore();
  }
  private water(ctx:CanvasRenderingContext2D,scene:Scene,t:number){
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
  private ambient(ctx:CanvasRenderingContext2D,sim:Simulation,t:number,reduced:boolean){
    if(sim.map==='village')for(const [x,y,w,h] of [[180,145,64,92],[1740,180,65,74],[1835,580,64,78]]){
      // Uneven pixel ribbons leave the stream visible at the sides of the cascade.
      for(let column=0;column<18;column++){const px=x-w/2+column*w/18,edge=Math.abs(column-8.5)/8.5,top=y+edge*9,length=h-edge*13;
        for(let band=0;band<8;band++){ctx.fillStyle=['#cffcf3','#b2fbf0','#91f2ed','#75e9e8','#61dfe3','#4ad4df','#35c7d8','#2bbdce'][band];ctx.fillRect(px,top+band*length/8,w/18+1,length/8+2);}}
      ctx.fillStyle='#ebfff4';for(let i=0;i<10;i++)ctx.fillRect(x-w/2+i*w/10,y+Math.sin(i)*3,w/10,3);
      for(let i=0;i<26;i++){const px=x-w/2+4+rand(i+19)*(w-8),py=y+((i*23+t*95)%h);ctx.fillStyle=i%3?'#e5fff6d9':'#3bd9e3';ctx.fillRect(px,py,2+i%3,12+i%18);}
      for(let i=0;i<7;i++)oval(ctx,x+(i-3)*w/8,y+h+Math.sin(t*4+i)*2,7,3,'#d4fff1b0');
    }
    const forge=sim.scene.props.find(p=>p.id==='forge');if(forge){const k=forge.size/235,x=forge.x+effects.forge.flameOffset[0]*k,y=forge.y+effects.forge.flameOffset[1]*k;oval(ctx,x,y,12+Math.sin(t*11)*2,10,'#ffaa3240');ctx.fillStyle='#f28a32';ctx.beginPath();ctx.moveTo(x-8,y+5);ctx.lineTo(x-4,y-9-Math.sin(t*12)*3);ctx.lineTo(x,y-3);ctx.lineTo(x+6,y-12+Math.sin(t*14)*3);ctx.lineTo(x+9,y+5);ctx.fill();ctx.fillStyle='#ffe78c';ctx.fillRect(x-3,y-3,5,8);for(let i=0;i<effects.forge.smokeCount;i++){const progress=(t*.35+i/effects.forge.smokeCount)%1;oval(ctx,forge.x+effects.forge.chimneyOffset[0]*k+Math.sin(progress*5)*13,forge.y+effects.forge.chimneyOffset[1]*k-progress*90,4+progress*12,5+progress*10,`rgba(226,233,220,${(1-progress)*.32})`);}ctx.fillStyle='#ffdc77';for(let i=0;i<effects.forge.sparkCount;i++){const age=(t*1.1+i/effects.forge.sparkCount)%1;ctx.fillRect(x+Math.sin(i*4)*age*12,y-age*28,2,3);}}
    if(reduced)return;
    for(let i=0;i<effects.leaves.count;i++){const x=(rand(i+56)*WIDTH+t*(8+i%5))%WIDTH,y=(rand(i+332)*HEIGHT+Math.sin(t+i)*12)%HEIGHT;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t+i));ctx.fillStyle=i%4?'#638e4090':'#f7dfacaa';ctx.fillRect(0,0,5,2);ctx.restore();}
    for(let i=0;i<effects.butterflies.count;i++){const x=420+i*210+Math.sin(t*.7+i)*24,y=650+Math.cos(t*.8+i*3)*100;const wing=2+Math.abs(Math.sin(t*12+i))*4;oval(ctx,x-wing/2,y,wing/2,3,i%2?'#fff6be':'#dfeeff');oval(ctx,x+wing/2,y,wing/2,3,i%2?'#fff6be':'#dfeeff');}
  }
  minimap(ctx:CanvasRenderingContext2D,sim:Simulation){ctx.clearRect(0,0,240,135);ctx.drawImage(this.ground(sim.scene),0,0,240,135);ctx.fillStyle='#4c704c';sim.scene.props.forEach(p=>{if(p.solid)ctx.fillRect(p.solid.x/8,p.solid.y/8,p.solid.w/8,p.solid.h/8);});ctx.fillStyle='#ffdc7b';sim.actors.filter(a=>a.role==='npc').forEach(a=>ctx.fillRect(a.x/8-2,a.y/8-2,4,4));oval(ctx,sim.pos.x/8,sim.pos.y/8,4,4,'#fff');}
}
