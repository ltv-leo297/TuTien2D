import type {Cast} from './simulation.ts';
export type Hazard={x:number;radius:number;height:number;active:boolean;progress:number};
// Renderer and collision consume exactly the same positions and activation windows.
export function groundHazards(cast:Cast,warning=false):Hazard[]{
 const k=cast.skill;
 if(k.pattern==='sequence')return [0,100,-100].map((offset,i)=>{
  const age=cast.elapsed-i*.3;
  return {x:cast.targetX+offset*cast.face,radius:k.radius,height:k.height,active:!warning&&age>=0&&age<.38,progress:Math.max(0,Math.min(1,age/.38))};
 });
 if(k.pattern==='wave')return [{x:cast.x+cast.face*k.travel!*Math.min(1,cast.elapsed/k.duration),radius:k.radius,height:k.height,active:!warning,progress:cast.elapsed/k.duration}];
 return [{x:cast.targetX,radius:k.radius,height:k.height,active:!warning,progress:cast.elapsed/k.duration}];
}
export function dashPosition(cast:Cast){return Math.max(90,Math.min(1190,cast.x+cast.face*cast.skill.travel!*Math.min(1,cast.elapsed/cast.skill.duration)));}
