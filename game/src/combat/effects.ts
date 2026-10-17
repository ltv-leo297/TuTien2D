import frames from './effect-frames.json';
import type {Skill} from './monsters.ts';
const index={seed:0,spore:1,leaf:2,jade:3};
export function drawProjectile(ctx:CanvasRenderingContext2D,img:HTMLImageElement,visual:Skill['visual'],x:number,y:number,r:number,angle:number){
 const [sx,sy,w,h]=frames.rects[index[visual]],height=r*2,width=height*w/h;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,sx,sy,w,h,-width/2,-height/2,width,height);ctx.restore();
}
export function drawEruption(ctx:CanvasRenderingContext2D,img:HTMLImageElement,visual:Skill['visual'],x:number,y:number,radius:number,height:number,progress:number){
 const [sx,sy,w,h]=frames.rects[4+index[visual]];
 // Keep damage bounds fully visible from activation; emergence is an internal shimmer.
 ctx.save();ctx.globalAlpha=.85+.15*Math.sin(progress*Math.PI);ctx.drawImage(img,sx,sy,w,h,x-radius,y-height,radius*2,height);ctx.restore();
}
