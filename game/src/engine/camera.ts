import {WIDTH,HEIGHT} from './scene.ts';
import type {Point} from './scene.ts';
export type Camera={x:number;y:number;scale:number;width:number;height:number;dpr:number};
export function cameraFor(width:number,height:number,follow:Point,dpr=1):Camera {
  const scale=Math.max(.8,Math.min(1.2,width/WIDTH,height/HEIGHT));
  const clamp=(value:number,world:number,view:number)=>view>=world?(world-view)/2:Math.max(0,Math.min(world-view,value-view/2));
  return {x:clamp(follow.x,WIDTH,width/scale),y:clamp(follow.y,HEIGHT,height/scale),scale,width,height,dpr:Math.max(1,Math.min(2,dpr))};
}
export const toWorld=(p:Point,c:Camera):Point=>({x:p.x/c.scale+c.x,y:p.y/c.scale+c.y});
export const toScreen=(p:Point,c:Camera):Point=>({x:(p.x-c.x)*c.scale,y:(p.y-c.y)*c.scale});
