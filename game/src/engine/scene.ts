import {createForest} from './forest.ts';
import type {Vegetation} from './forest-layers.ts';
import {MONSTERS,MONSTER_IDS} from '../combat/monsters.ts';
export type MapId = 'village' | 'forest' | 'mountain' | 'north';
export type HeroId = 'A' | 'B' | 'C' | 'D';
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Prop = Point & { id: string; tile: number; size: number; solid?: Rect; sway?: boolean; atlas?: 'scenery'|'forest'|'structures'; layer?: 'ground'; flip?: boolean; heightScale?: number; hidden?: boolean };
export type Actor = Point & { id: string; skin: HeroId; role: 'npc' | 'resource' | 'monster'; appearance?: 'farmer'|'child'; itemId?: string; forestTile?: number; level?: number; mapSize?: number; patrol?: Point[] };
export type Gate = Rect & { id: string; to: MapId; spawn: Point };
export type Bridge = { propId: string; deck: Point[] };
export type River = { points: Point[]; width: number };
export type Garden = Rect & { gateX: number };
export type Scene = { id: MapId; props: Prop[]; actors: Actor[]; gates: Gate[]; paths: Point[][]; water: Rect[]; rivers?: River[]; gardens?: Garden[]; bridges?: Bridge[]; spawn: Point; cascades?: Rect[]; terraces?: Rect[]; landscape?: boolean; walkable?: Point[][]; vegetation?: Vegetation[] };
export const WIDTH = 1920, HEIGHT = 1080, RADIUS = 10, CELL = 20;
export function gateCenter(gate:Gate):Point {
  return {
    x:Math.max(48,Math.min(WIDTH-48,gate.x+gate.w/2)),
    y:Math.max(48,Math.min(HEIGHT-48,gate.y+gate.h/2)),
  };
}
export function gateSignFoot(gate:Gate):Point {
  const center=gateCenter(gate);
  if(gate.x<=0)return {x:center.x+55,y:center.y+52};
  if(gate.x+gate.w>=WIDTH)return {x:center.x-55,y:center.y+52};
  if(gate.y<=0)return {x:center.x+60,y:center.y+64};
  return {x:center.x+60,y:Math.min(HEIGHT-8,center.y+64)};
}
export function gateMarker(gate:Gate):Point {
  const foot=gateSignFoot(gate);
  return {x:foot.x,y:foot.y-64};
}
export function gateSignSolid(gate:Gate):Rect {
  const foot=gateSignFoot(gate);
  return {x:foot.x-6,y:foot.y-9,w:12,h:9};
}
const prop = (id: string, tile: number, x: number, y: number, size: number, w = 0, h = 0): Prop => {
  // Bamboo has many rooted stalks; rocks and the well occupy their full base.
  if(w&&tile===5)w=Math.max(w,size*.7);
  if(w&&tile===8)w=Math.max(w,size*.85);
  if(w&&tile===7)w=Math.max(w,size*.78);
  return {id,tile,x,y,size,solid:w?{x:x-w/2,y:y-h,w,h:h+5}:undefined,sway:tile>=4&&tile<=6};
};
const woodland = (seed: number, gapY = 530): Prop[] => {
  const out: Prop[] = [];
  for(let i=0;i<56;i++) {
    const x=55+((i*137+seed*47)%1810), y=95+((i*239+seed*131)%920);
    if((x>115&&x<275) || (x>220 && x<1710 && y>170 && y<930) || Math.abs(y-gapY)<100 || (x>1710&&Math.abs(y-690)<115) || (x>840 && x<1080)) continue;
    out.push(prop(`edge-${seed}-${i}`,i%5===0?5:4,x,y,120+(i%3)*16,30,24));
  }
  return out;
};
// E layout: deliberately composed neighbourhoods, not a ring of evenly spaced trees.
const bridge=(id:string,x:number,y:number,size=220)=>prop(id,11,x,y,size);
const westBridge=bridge('bridge',120,594),eastBridge=bridge('bridge-east',1810,980,230);
const deck=(p:Prop):Bridge=>({propId:p.id,deck:[[31,112],[107,56],[352,159],[286,209]].map(([x,y])=>({x:p.x+(x-371/2)*p.size/371,y:p.y+(y-258)*p.size/371}))});
const gardens:Garden[]=[{x:423,y:322,w:323,h:208,gateX:570},{x:1090,y:200,w:360,h:188,gateX:1220},{x:1335,y:542,w:385,h:198,gateX:1485},{x:620,y:738,w:540,h:140,gateX:825}];
const village:Scene={
  id:'village',spawn:{x:960,y:560},
  paths:[[{x:0,y:525},{x:295,y:585},{x:520,y:640},{x:720,y:540},{x:960,y:535},{x:1180,y:640},{x:1460,y:820},{x:1920,y:930}],
    [{x:960,y:545},{x:960,y:360},{x:1020,y:205},{x:990,y:0}],
    [{x:550,y:635},{x:490,y:755},{x:535,y:865},{x:625,y:945},{x:870,y:1080}],
    [{x:570,y:560},{x:570,y:630}],[{x:1220,y:380},{x:1150,y:445},{x:990,y:500}],
    [{x:1485,y:730},{x:1400,y:785}],[{x:825,y:870},{x:825,y:960},{x:625,y:945}]],
  water:[],rivers:[{width:85,points:[{x:180,y:-60},{x:180,y:150},{x:125,y:310},{x:120,y:530},{x:145,y:685},{x:275,y:860},{x:410,y:950},{x:545,y:1130}]},
    {width:90,points:[{x:1730,y:-50},{x:1740,y:200},{x:1835,y:390},{x:1835,y:655},{x:1810,y:910},{x:1945,y:1055}]}],
  gardens,bridges:[deck(westBridge),deck(eastBridge)],
  props:[prop('clinic',1,570,440,250,228,110),prop('school',0,1270,310,255,228,100),prop('forge',2,1560,635,265,249,112),prop('home',3,820,835,265,249,105),prop('well',7,1050,825,125,98,55),westBridge,eastBridge],
  actors:[{id:'teacher',skin:'B',role:'npc',x:1220,y:365},{id:'healer',skin:'C',role:'npc',x:570,y:490},{id:'smith',skin:'A',role:'npc',x:1485,y:695},
    {id:'amoc',skin:'B',appearance:'farmer',role:'npc',x:530,y:640,patrol:[{x:530,y:640},{x:610,y:580},{x:520,y:700}]},
    {id:'bangi',skin:'D',role:'npc',x:1245,y:710,patrol:[{x:1245,y:710},{x:1310,y:770},{x:1230,y:810}]},
    {id:'adao',skin:'C',role:'npc',x:1060,y:455,patrol:[{x:1060,y:455},{x:1130,y:510},{x:1040,y:460}]},
    {id:'benam',skin:'A',appearance:'child',role:'npc',x:1335,y:820,patrol:[{x:1335,y:820},{x:1430,y:860},{x:1230,y:890}]},
    {id:'chulam',skin:'B',appearance:'farmer',role:'npc',x:720,y:930,patrol:[{x:720,y:930},{x:655,y:900},{x:780,y:975}]}],
  gates:[{id:'forest',x:0,y:455,w:42,h:145,to:'forest',spawn:{x:1820,y:540}},{id:'mountain',x:1878,y:855,w:42,h:145,to:'mountain',spawn:{x:100,y:690}},{id:'north',x:920,y:0,w:145,h:42,to:'north',spawn:{x:980,y:960}}]
};
for(const p of village.props)if(p.tile<4)p.heightScale=.84;
// Position lists preserve the reference's asymmetry and gaps around the roads.
const trees=[[-15,80,165],[80,75,150],[300,90,170],[405,110,155],[530,95,175],[690,70,145],[825,80,160],
  [315,245,155],[425,235,140],[770,245,150],[860,200,138],[720,350,160],[330,445,158],[270,335,145],
  [1110,75,160],[1260,60,145],[1390,175,155],[1540,145,165],[1635,65,150],[1655,300,165],[1765,365,145],[1720,480,130],
  [605,750,165],[690,685,150],[455,835,145],[550,935,145],[1550,950,170],[1655,930,155],[1730,805,145],
  [45,850,145],[85,1030,180],[220,1095,180],[400,1100,165],[1140,1110,180],[1310,1075,170],[1460,1110,165],[1705,1090,180],[1855,1125,170]];
for(const [i,[x,y,size]] of trees.entries())village.props.push(prop(`grove-${i}`,4,x,y,size,34,26));
// Overlapping, irregular groves frame the clearing. The middle remains open for play.
const canopy=[[-35,220,170],[20,310,154],[45,80,186],[95,40,174],
  [245,45,178],[367,42,185],[483,12,186],[610,15,175],[740,4,192],[857,32,148],
  [380,160,145],[465,175,135],[557,122,152],[637,115,150],[712,142,140],[770,84,163],
  [1090,30,184],[1148,126,150],[1240,55,190],[1340,88,163],[1435,45,185],[1530,58,185],[1670,115,150],
  [1570,232,140],[1598,376,145],[1740,443,175],[1904,195,170],[1893,364,164],[1917,481,158],
  [52,824,183],[15,976,166],[162,1020,150],[270,1148,196],[366,1045,155],
  [1235,1130,174],[1417,1040,174],[1503,1025,160],[1600,1068,189],[1740,1070,177],[1850,1110,193]];
for(const [i,[x,y,size]] of canopy.entries())village.props.push({...prop(`canopy-${i}`,4,x,y,size,34,26),flip:i%3===0});
for(const [i,[x,y,size]] of [[300,130,140],[330,230,140],[55,430,160],[375,795,140],[355,915,150],[1290,960,155],[1390,1040,145],[1600,325,130],[1665,205,145],[1715,710,145],[1755,90,150],[35,1100,175]].entries())village.props.push(prop(`bamboo-grove-${i}`,5,x,y,size,45,30));
for(const [i,[x,y,size]] of [[385,475,120],[1455,280,125],[1190,1060,145],[30,700,135]].entries())village.props.push(prop(`blossom-${i}`,6,x,y,size,30,25));
function detail(id:string,tile:number,x:number,y:number,size:number,w=0,h=0):Prop{return {id,tile,x,y,size,atlas:'scenery',solid:w?{x:x-w/2,y:y-h,w,h:h+3}:undefined};}
for(const [i,g] of gardens.entries()){
  // Front fence is split at the gate. Side rails stop before the entrance.
  for(let x=g.x+28;x<g.x+g.w;x+=52){if(Math.abs(x-g.gateX)<63)continue;village.props.push(detail(`fence-front-${i}-${x}`,2,x,g.y+g.h,64,52,10));}
  // Short diagonal returns use the atlas's native perspective, joining the front corners.
  for(const [side,x] of [g.x+5,g.x+g.w-5].entries())for(let n=0;n<3;n++){
    const px=x+(side===0?1:-1)*n*36,py=g.y+g.h-14-n*25;
    village.props.push({...detail(`fence-side-${i}-${side}-${n}`,3,px,py,65,42,20),flip:side===0});
  }
  for(const x of [g.gateX-63,g.gateX+63])village.props.push(detail(`lantern-${i}-${x}`,5,x,g.y+g.h+4,70,13,15));
  for(let x=g.x+20;x<g.x+g.w;x+=49){if(Math.abs(x-g.gateX)<72)continue;village.props.push(prop(`garden-flower-${i}-${x}`,9,x,g.y+g.h+13+(x%3)*4,30+(x%4)*3));}
}
for(const [i,[x,y,size]] of [[355,615,70],[760,420,73],[1280,900,70],[1690,775,66]].entries())village.props.push(detail(`stone-lantern-${i}`,4,x,y,size,27,24));
for(const x of [913,1090])village.props.push(detail(`north-pillar-${x}`,9,x,225,75,30,26));
for(const [i,[x,y]] of [[455,418],[700,478],[1410,335],[1160,266],[1710,668],[1125,880]].entries())village.props.push(detail(`herb-bed-${i}`,10,x,y,67,52,25));
for(const [i,[x,y]] of [[670,415],[1375,350],[1420,637],[995,865]].entries())village.props.push(detail(`bench-${i}`,11,x,y,68,52,20));
// Banks use the same measured river centerline as collision and water rendering.
for(const [riverIndex,river] of village.rivers!.entries()){
  for(let seg=1;seg<river.points.length;seg++){
    const a=river.points[seg-1],b=river.points[seg],length=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(length/57);
    for(let k=0;k<steps;k++){
      const t=k/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
      const nearBridge=riverIndex===0?y>425&&y<645:y>810&&y<1020;if(nearBridge)continue;
      for(const sign of [-1,1]){const nx=(b.y-a.y)/length*sign,ny=-(b.x-a.x)/length*sign;
        const bx=x+nx*(river.width/2+35),by=y+ny*(river.width/2+35)+30;
        village.props.push({...detail(`cliff-${riverIndex}-${seg}-${k}-${sign}`,k%3===0?1:0,bx,by,112+((k+seg)%3)*13,57,27),flip:(k+seg)%2===0});
        if(k%2===0)village.props.push(prop(`bank-flower-${riverIndex}-${seg}-${k}-${sign}`,9,bx+nx*24,by+10,47));}
      if(k%3===1)village.props.push({...detail(`lotus-${riverIndex}-${seg}-${k}`,6,x,y,40),layer:'ground'});
    }
  }
}
// Flower clusters follow gardens and clearings; their roots do not form walls.
const flowers=[[400,310],[390,395],[415,480],[720,460],[740,530],[650,270],[780,350],[1140,130],[1400,240],[1475,365],[1150,425],[1340,415],[1360,510],[1720,560],[1710,735],[1300,690],[1635,795],[640,760],[650,885],[715,945],[1010,950],[1160,935],[1130,750],[1020,790],[345,700],[445,955],[1260,1030],[1510,975],[1610,400],[1600,835],[300,255]];
for(const [i,[x,y]] of flowers.entries()){
  for(let j=0;j<3;j++)village.props.push(detail(`flowers-${i}-${j}`,j===1?8:7,x+(j-1)*28,y+(j%2)*16,42+(i+j)%3*9));
}
// Island planting: flowers and low shrubs under trees, rocks at the outer road bends.
for(const [i,[x,y,size]] of [[630,206,98],[820,254,74],[1428,455,62],[1340,532,46],[1220,570,45],[1550,829,59],[443,902,68],[1127,987,63]].entries())village.props.push(prop(`meadow-rock-${i}`,8,x,y,size,size*.64,size*.26));
for(const [i,[x,y]] of [[510,190],[577,229],[795,325],[855,290],[390,540],[720,498],[811,416],[1310,466],[1450,478],[1240,595],[1145,545],[1145,695],[1620,376],[1545,865],[950,950],[992,1030],[535,1015],[345,870],[1345,998]].entries()){
  village.props.push(prop(`meadow-bush-${i}`,9,x,y,51+i%3*12));
  village.props.push(detail(`meadow-fern-${i}`,8,x+33,y+14,36+i%4*6));
}
function wilderness(id: 'forest'|'mountain'): Scene {
  const forest=id==='forest';
  const props:Prop[]=[];
  for(let i=0;i<70;i++) {const x=70+(i*173%1770), y=100+(i*293%850); if(y>430&&y<760)continue; props.push(prop(`${id}-${i}`,forest?(i%3?4:5):8,x,y,forest?130:100,forest?30:60,forest?25:32));}
  return {id,spawn:forest?{x:1820,y:540}:{x:100,y:690},props,water:[],paths:[[{x:0,y:690},{x:700,y:590},{x:1300,y:535},{x:1920,y:540}]],actors:forest?[
    {id:'herb',skin:'C',role:'resource',x:680,y:710},{id:'bamboo',skin:'B',role:'resource',x:1070,y:710},{id:'mushroom',skin:'D',role:'resource',x:1350,y:430},...MONSTER_IDS.map(id=>({id,role:'monster' as const,...MONSTERS[id].forest}))
  ]:[{id:'ore',skin:'A',role:'resource',x:700,y:430},{id:'stone',skin:'B',role:'resource',x:1120,y:710},{id:'soil',skin:'C',role:'resource',x:450,y:740},{id:'stone-beast',skin:'D',role:'monster',x:1250,y:425},{id:'rock-spirit',skin:'A',role:'monster',x:900,y:740}],gates:[forest?{id:'village',x:1878,y:465,w:42,h:145,to:'village',spawn:{x:55,y:535}}:{id:'village',x:0,y:615,w:42,h:145,to:'village',spawn:{x:1860,y:930}}]};
}
export const SCENES: Record<MapId,Scene>={village,forest:createForest(),mountain:wilderness('mountain'),north:{id:'north',spawn:{x:980,y:960},props:[...woodland(3),prop('road-rock',8,985,210,160,100,55)],water:[],paths:[[{x:980,y:1080},{x:980,y:270}]],actors:[{id:'guard',skin:'A',role:'npc',x:1040,y:300}],gates:[{id:'village',x:910,y:1038,w:160,h:42,to:'village',spawn:{x:990,y:95}}]}};
export function intersects(p:Point, r:Rect, radius=RADIUS) {return p.x+radius>r.x&&p.x-radius<r.x+r.w&&p.y+radius>r.y&&p.y-radius<r.y+r.h;}
export function inPolygon(p:Point,vertices:Point[]) {
  let result=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
    const a=vertices[i],b=vertices[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
  }
  return result;
}
export function riverDistance(p:Point,river:River) {
  let nearest=Infinity;
  for(let i=1;i<river.points.length;i++){const a=river.points[i-1],b=river.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));nearest=Math.min(nearest,Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t));}
  return nearest;
}
export function waterAt(scene:Scene,p:Point,radius=0){return scene.water.some(r=>intersects(p,r,radius))||(scene.rivers??[]).some(r=>riverDistance(p,r)<r.width/2+radius);}
export function waterBlocked(scene:Scene,p:Point) {
  if((scene.rivers??[]).some(r=>riverDistance(p,r)<r.width/2+RADIUS)){
    // Only the part of the foot over water needs deck support; the bank is walkable.
    for(let dx=-RADIUS;dx<=RADIUS;dx+=5)for(let dy=-RADIUS;dy<=RADIUS;dy+=5){
      const foot={x:p.x+dx,y:p.y+dy};
      if((scene.rivers??[]).some(r=>riverDistance(foot,r)<r.width/2)&&!(scene.bridges??[]).some(b=>inPolygon(foot,b.deck)))return true;
    }
  }
  return scene.water.some(r=>{
    if(!intersects(p,r))return false;
    // Every corner of the foot area over water must be on the same deck.
    const left=Math.max(p.x-RADIUS,r.x),right=Math.min(p.x+RADIUS,r.x+r.w);
    const top=Math.max(p.y-RADIUS,r.y),bottom=Math.min(p.y+RADIUS,r.y+r.h);
    return !(scene.bridges??[]).some(b=>[{x:left,y:top},{x:right,y:top},{x:left,y:bottom},{x:right,y:bottom}].every(c=>inPolygon(c,b.deck)));
  });
}
export function outsideWalkable(scene:Scene,p:Point){
  if(!scene.walkable)return false;
  return [[0,0],[-RADIUS,-RADIUS],[RADIUS,-RADIUS],[-RADIUS,RADIUS],[RADIUS,RADIUS]].some(([dx,dy])=>!scene.walkable!.some(poly=>inPolygon({x:p.x+dx,y:p.y+dy},poly)));
}
export function blocked(scene:Scene,p:Point) {return outsideWalkable(scene,p)||p.x<RADIUS||p.y<RADIUS||p.x>WIDTH-RADIUS||p.y>HEIGHT-RADIUS||waterBlocked(scene,p)||scene.props.some(o=>o.solid&&intersects(p,o.solid))||scene.gates.some(g=>intersects(p,gateSignSolid(g)));}
export function inside(p:Point,r:Rect) {return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}
