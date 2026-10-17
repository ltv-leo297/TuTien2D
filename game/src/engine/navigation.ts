import {blocked,waterBlocked,outsideWalkable,inPolygon,RADIUS,CELL,WIDTH,HEIGHT} from './scene.ts';
import type {Point,Scene,Rect} from './scene.ts';
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
function crossesWalkableBoundary(scene:Scene,a:Point,b:Point){
  const regions=scene.walkable;if(!regions)return false;
  if(outsideWalkable(scene,a)||outsideWalkable(scene,b))return true;
  const dx=b.x-a.x,dy=b.y-a.y;
  // Test every interval between exact polygon crossings for each foot corner.
  // Fixed-distance samples can miss a thin concave gap and produce a route that
  // smaller, variable frame steps cannot follow.
  for(const [ox,oy] of [[0,0],[-RADIUS,-RADIUS],[RADIUS,-RADIUS],[-RADIUS,RADIUS],[RADIUS,RADIUS]]){
    const x=a.x+ox,y=a.y+oy,cuts=[0,1];
    for(const polygon of regions)for(let i=0;i<polygon.length;i++){
      const p=polygon[i],q=polygon[(i+1)%polygon.length],ex=q.x-p.x,ey=q.y-p.y,den=dx*ey-dy*ex;
      if(Math.abs(den)<1e-10)continue;
      const t=((p.x-x)*ey-(p.y-y)*ex)/den,u=((p.x-x)*dy-(p.y-y)*dx)/den;
      if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);
    }
    cuts.sort((a,b)=>a-b);
    for(let i=1;i<cuts.length;i++){
      const t=(cuts[i-1]+cuts[i])/2;
      if(!regions.some(polygon=>inPolygon({x:x+dx*t,y:y+dy*t},polygon)))return true;
    }
  }
  return false;
}
function crossesFootprint(a:Point,b:Point,r:Rect){
  let enter=0,exit=1;
  for(const [origin,delta,min,max] of [[a.x,b.x-a.x,r.x-RADIUS,r.x+r.w+RADIUS],[a.y,b.y-a.y,r.y-RADIUS,r.y+r.h+RADIUS]]){
    if(Math.abs(delta)<1e-12){if(origin<=min||origin>=max)return false;continue;}
    const t1=(min-origin)/delta,t2=(max-origin)/delta;
    enter=Math.max(enter,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2));
    if(enter>=exit)return false;
  }
  return enter<exit;
}
export function clearSegment(scene:Scene,a:Point,b:Point) {
  if([a,b].some(p=>p.x<RADIUS||p.y<RADIUS||p.x>WIDTH-RADIUS||p.y>HEIGHT-RADIUS))return false;
  // An exact swept rectangle catches a grazing corner between samples. Otherwise
  // A* can repeatedly return a route that the smaller movement steps reject.
  if(scene.props.some(p=>p.solid&&crossesFootprint(a,b,p.solid)))return false;
  if(crossesWalkableBoundary(scene,a,b))return false;
  const n=Math.ceil(distance(a,b)/4);
  for(let i=0;i<=n;i++){const t=n?i/n:0;if(waterBlocked(scene,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}))return false;}return true;
}
const cols=WIDTH/CELL, rows=HEIGHT/CELL;
const center=(id:number):Point=>({x:(id%cols)*CELL+CELL/2,y:Math.floor(id/cols)*CELL+CELL/2});
const cell=(p:Point)=>Math.max(0,Math.min(rows-1,Math.floor(p.y/CELL)))*cols+Math.max(0,Math.min(cols-1,Math.floor(p.x/CELL)));
export function findPath(scene:Scene,start:Point,goal:Point):Point[] {
  if(blocked(scene,start))return [];
  if(!blocked(scene,goal)&&clearSegment(scene,start,goal))return [goal];
  const begin=cell(start), wanted=cell(goal), open=new Set([begin]), parent=new Map<number,number>();
  const costs=new Map([[begin,0]]), closed=new Set<number>();let best=begin,bestD=Infinity;
  while(open.size){
    let current=-1,score=Infinity;
    for(const id of open){const f=costs.get(id)!+distance(center(id),goal);if(f<score){score=f;current=id;}}
    open.delete(current);closed.add(current);
    const cp=current===begin?start:center(current), d=distance(cp,goal);
    if(d<bestD){bestD=d;best=current;}
    if((current===wanted||d<CELL*2)&&!blocked(scene,goal)&&clearSegment(scene,cp,goal)){best=current;break;}
    const x=current%cols,y=Math.floor(current/cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      if(x+dx<0||y+dy<0||x+dx>=cols||y+dy>=rows)continue;
      const next=(y+dy)*cols+x+dx,np=center(next);if(closed.has(next)||!clearSegment(scene,cp,np))continue;
      const cost=costs.get(current)!+distance(cp,np);if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);parent.set(next,current);open.add(next);}
    }
  }
  const route:Point[]=[];let id=best;
  while(id!==begin){route.unshift(center(id));const previous=parent.get(id);if(previous===undefined)return [];id=previous;}
  if(!blocked(scene,goal)&&clearSegment(scene,route.at(-1)??start,goal))route.push(goal);
  // Greedy visibility smoothing still tests the complete swept foot hitbox.
  const smooth:Point[]=[];let from=start;
  for(let i=0;i<route.length;){let far=i;while(far+1<route.length&&clearSegment(scene,from,route[far+1]))far++;smooth.push(route[far]);from=route[far];i=far+1;}
  return smooth;
}
export function walk(scene:Scene,pos:Point,route:Point[],budget:number):number {
  let moved=0;
  while(route.length&&budget>0){const next=route[0],d=distance(pos,next);if(d<.01){route.shift();continue;}const step=Math.min(budget,d,4),p={x:pos.x+(next.x-pos.x)/d*step,y:pos.y+(next.y-pos.y)/d*step};if(!clearSegment(scene,pos,p)){route.length=0;break;}Object.assign(pos,p);moved+=step;budget-=step;if(step>=d-.001)route.shift();}return moved;
}
