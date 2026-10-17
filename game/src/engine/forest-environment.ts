import water from './forest-water.json';
import metadata from './forest-vegetation.json';
import {vegetationBend} from './forest-layers.ts';
import type {Vegetation} from './forest-layers.ts';

let waterMask:Path2D|undefined;
function mask(){
 if(!waterMask){waterMask=new Path2D();for(const polygon of water.polygons){polygon.forEach(([x,y],i)=>i?waterMask!.lineTo(x,y):waterMask!.moveTo(x,y));waterMask.closePath();}}
 return waterMask;
}
// One source-space mask for river, pools and falls. Animated water never crosses a bank.
// Cache patterns once per source/phase, not per frame. The source rectangles were visually
// inspected: 1774×887 sheet, divisions x=0/443/887/1330/1774 and y=443.
const textures=new WeakMap<HTMLImageElement,HTMLCanvasElement[]>();
function waterTextures(image:HTMLImageElement){
 let result=textures.get(image);if(result)return result;
 const xs=[0,443,887,1330,1774];result=[];
 for(let row=0;row<2;row++)for(let col=0;col<4;col++){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d')!;g.imageSmoothingEnabled=false;
  g.drawImage(image,xs[col],row?443:0,xs[col+1]-xs[col],row?444:443,0,0,128,128);result.push(c);
 }textures.set(image,result);return result;
}
export function drawForestWater(ctx:CanvasRenderingContext2D,img:HTMLImageElement,t:number){
 const frames=waterTextures(img),frame=Math.floor(t*6)%4;
 ctx.save();ctx.scale(1920/water.width,1080/water.height);ctx.clip(mask());
 ctx.save();ctx.translate(-((t*10)%128),(t*22)%128);ctx.fillStyle=ctx.createPattern(frames[frame],'repeat')!;ctx.fillRect(-128,-128,water.width+256,water.height+256);ctx.restore();
 for(const [x,y,w,h] of [[776,0,66,188],[873,102,27,78],[790,329,52,44],[746,512,45,56],[403,800,45,68],[48,530,49,52]]){
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  const offset=(t*145)%128;ctx.translate(x,y+offset);ctx.fillStyle=ctx.createPattern(frames[4+frame],'repeat')!;ctx.fillRect(0,-128,w,h+128);ctx.restore();
  for(let n=0;n<32;n++){
   const phase=(t*1.6+n/32)%1,angle=n*2.4,xx=x+w/2+Math.cos(angle)*(w*.35+phase*w*.45),yy=y+h+Math.sin(angle)*phase*17;
   ctx.fillStyle=n%3?'#efffff':'#a2f9ef';ctx.fillRect(Math.round(xx),Math.round(yy),4+(1-phase)*7,3);
  }
 }
 ctx.restore();
}
export function drawVegetation(ctx:CanvasRenderingContext2D,img:HTMLImageElement,v:Vegetation,t:number){
 const [sx,sy,sw,sh]=metadata[v.kind].rect,k=v.height/sh,width=sw*k;
 ctx.save();ctx.translate(Math.round(v.x),Math.round(v.y));if(v.flip)ctx.scale(-1,1);
 // Small overlapping strips bend the crown while the bottom 20% remains rooted.
 const bands=20;
 for(let i=0;i<bands;i++){
  const top=Math.floor(i*sh/bands),bottom=Math.min(sh,Math.ceil((i+1)*sh/bands)+1);
  const dx=vegetationBend(1-top/sh,t,v.phase,v.kind);
  ctx.drawImage(img,sx,sy+top,sw,bottom-top,-width/2+dx,-v.height+top*k,width,(bottom-top)*k);
 }
 ctx.restore();
}
