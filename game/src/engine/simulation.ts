import {SCENES,blocked,inside} from './scene.ts';
import type {Actor,HeroId,MapId,Point} from './scene.ts';
import {findPath,walk,distance,clearSegment} from './navigation.ts';
export type MovingActor=Actor & {route:Point[];direction:number;phase:number;patrolIndex:number;wait:number};
export type Event={type:'talk'|'gather'|'cooldown'|'map'|'blocked';id:string;itemId?:string};
export class Simulation {
  map:MapId='village'; hero:HeroId; pos:Point={...SCENES.village.spawn};route:Point[]=[];direction=0;phase=1; moving=false;time=0;
  actors:MovingActor[]=[];pending:string|null=null;destination:Point|null=null;visited=new Set<string>();bag:Record<string,number>={};cooldowns:Record<string,number>={};events:Event[]=[];transitions=0;
  constructor(hero:HeroId){this.hero=hero;this.loadActors();}
  get scene(){return SCENES[this.map];}
  private navigationScene(exclude?:string,includePlayer=false){return {...this.scene,props:[...this.scene.props,...this.actors.filter(a=>a.id!==exclude).map(a=>{const r=a.role==='monster'?20:a.role==='resource'?12:10;return {id:`body-${a.id}`,x:a.x,y:a.y,tile:0,size:0,solid:{x:a.x-r,y:a.y-r,w:r*2,h:r*2}};}),...(includePlayer?[{id:'player-body',x:this.pos.x,y:this.pos.y,tile:0,size:0,solid:{x:this.pos.x-10,y:this.pos.y-10,w:20,h:20}}]:[])]};}
  loadActors(){this.actors=this.scene.actors.map(a=>({...a,route:[],direction:0,phase:1,patrolIndex:0,wait:2}));}
  go(point:Point,actorId?:string){
    this.pending=actorId??null;let goal=point;const navigation=this.navigationScene();let approach:Point[]|undefined;
    if(actorId){const actor=this.actors.find(a=>a.id===actorId);if(actor){
      actor.route=[];goal={x:actor.x,y:actor.y+42};
      // A prop can block one side of an actor. Try the other approaches before failing.
      for(const [dx,dy] of [[0,42],[-42,0],[42,0],[0,-42],[-32,32],[32,32],[-32,-32],[32,-32]]){
        const candidate={x:actor.x+dx,y:actor.y+dy};if(blocked(navigation,candidate)||!clearSegment(this.scene,candidate,actor))continue;
        const route=findPath(navigation,this.pos,candidate);if(route.length&&distance(route.at(-1)!,candidate)<2){goal=candidate;approach=route;break;}
      }
    }}
    this.route=approach??findPath(navigation,this.pos,goal);this.destination=this.route.at(-1)??null;
    if(!this.destination||distance(this.destination,goal)>25)this.events.push({type:'blocked',id:''});
  }
  update(dt:number){
    dt=Math.min(.1,Math.max(0,dt));this.time+=dt;
    const old={...this.pos},goal=this.route.at(-1),navigation=this.navigationScene();this.moving=walk(navigation,this.pos,this.route,dt*210)>0;
    if(goal&&!this.route.length&&distance(this.pos,goal)>3)this.route=findPath(navigation,this.pos,goal);
    if(this.moving){this.direction=facing(this.pos.x-old.x,this.pos.y-old.y);this.phase=(this.phase+dt*9)%4;}else this.phase=1;
    for(const actor of this.actors){
      if(!actor.patrol||actor.id===this.pending)continue;
      const before={x:actor.x,y:actor.y};
      const navigation=this.navigationScene(actor.id,true);
      if(actor.route.length){walk(navigation,actor,actor.route,dt*40);actor.direction=facing(actor.x-before.x,actor.y-before.y);actor.phase=(actor.phase+dt*6)%4;}
      else{actor.phase=1;actor.wait-=dt;if(actor.wait<=0){actor.patrolIndex=(actor.patrolIndex+1)%actor.patrol.length;actor.route=findPath(navigation,actor,actor.patrol[actor.patrolIndex]);actor.wait=3;}}
    }
    if(this.pending){const actor=this.actors.find(a=>a.id===this.pending);if(actor&&distance(this.pos,actor)<65&&clearSegment(this.scene,this.pos,actor)){
      this.pending=null;this.route=[];this.destination=null;
      if(actor.role==='resource'){if((this.cooldowns[actor.id]??0)>this.time)this.events.push({type:'cooldown',id:actor.id});else{const itemId=actor.itemId??actor.id;this.bag[itemId]=(this.bag[itemId]??0)+1;this.cooldowns[actor.id]=this.time+20;this.events.push({type:'gather',id:actor.id,itemId});}}
      else{this.visited.add(actor.id);this.events.push({type:'talk',id:actor.id});}
    }else if(!this.route.length){this.pending=null;}}
    if(!this.route.length)this.destination=null;
    const gate=this.scene.gates.find(g=>inside(this.pos,g));
    if(gate&&!blocked(SCENES[gate.to],gate.spawn)){this.map=gate.to;this.pos={...gate.spawn};this.route=[];this.pending=null;this.destination=null;this.loadActors();this.transitions++;this.events.push({type:'map',id:this.map});}
  }
}
export function facing(dx:number,dy:number){return Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;}
