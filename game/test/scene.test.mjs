import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,blocked,gateCenter,gateMarker,gateSignFoot,waterBlocked,waterAt} from '../src/engine/scene.ts';
import {findPath,clearSegment,distance,walk} from '../src/engine/navigation.ts';
import {cameraFor,toWorld,toScreen} from '../src/engine/camera.ts';
import {Simulation} from '../src/engine/simulation.ts';
import fs from 'node:fs';
import {MONSTERS,isMonster} from '../src/combat/monsters.ts';

test('every spawn, main NPC approach and gate has a collision-free route',()=>{
  for(const scene of Object.values(SCENES)){
    assert.equal(blocked(scene,scene.spawn),false,scene.id+' spawn');
    for(const actor of scene.actors){
      assert.equal(blocked(scene,actor),false,actor.id+' body is outside scenery');
      const s=new Simulation('A');s.map=scene.id;s.pos={...scene.spawn};s.loadActors();s.go(actor,actor.id);
      assert.ok(s.route.length,actor.id);assert.ok(distance(s.route.at(-1),actor)<65,actor.id+' reachable');
      let last=scene.spawn;for(const point of s.route){assert.ok(clearSegment(scene,last,point),actor.id+' swept segment');last=point;}
    }
    for(const gate of scene.gates){const target={x:gate.x+gate.w/2,y:gate.y+gate.h/2},route=findPath(scene,scene.spawn,target);assert.ok(route.length,scene.id+' '+gate.id);assert.ok(distance(route.at(-1),target)<15,gate.id+' arrival');assert.equal(blocked(SCENES[gate.to],gate.spawn),false,gate.id+' return spawn');}
  }
});
test('walking around a house never tunnels through its footprint, even with a large step',()=>{
  const scene=SCENES.village,start={x:330,y:340},goal={x:800,y:340};assert.equal(clearSegment(scene,start,goal),false);
  const route=findPath(scene,start,goal);assert.ok(route.length>1);const p={...start};for(let i=0;i<200&&route.length;i++){walk(scene,p,route,80);assert.equal(blocked(scene,p),false);}assert.ok(distance(p,goal)<1);
  const obstacleGoal={x:520,y:350};const fallback=findPath(scene,p,obstacleGoal);assert.ok(fallback.length);assert.equal(blocked(scene,fallback.at(-1)),false);
});
test('diagonal corner cannot squeeze through touching obstacles',()=>{
  const scene={...SCENES.village,water:[],props:[{id:'a',x:0,y:0,tile:0,size:0,solid:{x:100,y:50,w:50,h:100}},{id:'b',x:0,y:0,tile:0,size:0,solid:{x:50,y:150,w:50,h:50}}]};
  assert.equal(clearSegment(scene,{x:80,y:130},{x:125,y:175}),false);
});
test('a grazing corner between path samples is rejected before movement starts',()=>{
  const scene={...SCENES.village,water:[],rivers:[],bridges:[],props:[{solid:{x:110.5,y:80,w:10,h:11}}]};
  const start={x:100,y:100},goal={x:104,y:104};
  assert.equal(blocked(scene,start),false);assert.equal(blocked(scene,goal),false);
  assert.equal(clearSegment(scene,start,goal),false);
  const route=findPath(scene,start,goal),p={...start};
  for(let i=0;i<100&&route.length;i++){walk(scene,p,route,.7);assert.equal(blocked(scene,p),false);}
  assert.ok(distance(p,goal)<.1);
});
test('both winding rivers remain solid except for their actual bridge decks',()=>{
  const scene=SCENES.village;
  for(const [x,y] of [[180,80],[140,230],[120,400],[145,680],[275,860],[1740,100],[1835,655]])assert.equal(waterBlocked(scene,{x,y}),true);
  for(const [start,goal] of [[{x:260,y:580},{x:55,y:580}],[{x:1700,y:830},{x:1900,y:910}]]){
    const route=findPath(scene,start,goal);assert.ok(distance(route.at(-1),goal)<2);
    const p={...start};let onBridge=false;
    while(route.length){walk(scene,p,route,2);assert.equal(blocked(scene,p),false);if(waterAt(scene,p)){onBridge=true;assert.equal(waterBlocked(scene,p),false);}}
    assert.ok(onBridge,'route must cross its bridge');
  }
});
test('a narrow concave gap between navigation samples cannot trap variable frame movement',()=>{
 const scene={...SCENES.forest,props:[],water:[],rivers:[],gates:[],walkable:[[[0,0],[112.1,0],[112.1,94],[112.6,94],[112.6,0],[300,0],[300,300],[0,300]].map(([x,y])=>({x,y}))]};
 const start={x:100,y:100},goal={x:104,y:104};
 assert.equal(blocked(scene,start),false);assert.equal(blocked(scene,goal),false);assert.equal(clearSegment(scene,start,goal),false);
 for(const budget of [.7,3.36,5.1,21]){const p={...start},route=findPath(scene,start,goal);for(let i=0;i<1000&&route.length;i++)walk(scene,p,route,budget);assert.ok(distance(p,goal)<.1);}
});
test('forest plants on opposite banks remain reachable across varying frame times',()=>{
 for(const dt of [.016,.017,.024,.033,.1]){
  const s=new Simulation('A');s.map='forest';s.pos={x:1225,y:550};s.loadActors();
  for(const id of ['spirit-grass-1','spirit-grass-2']){s.go(s.actors.find(a=>a.id===id),id);for(let i=0;i<3000&&s.pending;i++){s.update(dt);assert.equal(blocked(s.scene,s.pos),false);}}
  assert.equal(s.bag['spirit-grass'],2,`both banks at dt=${dt}`);
 }
});
test('an enclosed destination remains unreachable and repeated retargeting never crosses solids',()=>{
  const scene={...SCENES.village,water:[],rivers:[],bridges:[],props:[
    {solid:{x:600,y:400,w:200,h:20}},{solid:{x:600,y:580,w:200,h:20}},
    {solid:{x:600,y:400,w:20,h:200}},{solid:{x:780,y:400,w:20,h:200}}
  ]};
  const start={x:900,y:500},goal={x:700,y:500},route=findPath(scene,start,goal),p={...start};
  while(route.length){walk(scene,p,route,7);assert.equal(blocked(scene,p),false);}
  assert.ok(distance(p,goal)>100);
  const s=new Simulation('A');
  for(let i=0;i<12;i++){s.go([{x:520,y:350},{x:1080,y:800},{x:193,y:580},{x:960,y:580}][i%4]);s.update(.8);assert.equal(blocked(s.scene,s.pos),false);}
});
test('interactions require approach and gathering happens once per cooldown',()=>{
  const s=new Simulation('A');s.go({x:1250,y:310},'teacher');s.update(.016);assert.equal(s.visited.size,0);
  for(let i=0;i<2000&&!s.visited.has('teacher');i++)s.update(.016);assert.ok(s.visited.has('teacher'));
  s.map='forest';s.pos={...SCENES.forest.spawn};s.loadActors();const herb=s.actors.find(a=>a.id==='herb');s.go(herb,'herb');for(let i=0;i<1500&&s.pending;i++)s.update(.016);assert.equal(s.bag.herb,1);
  s.go(herb,'herb');for(let i=0;i<50;i++)s.update(.016);assert.equal(s.bag.herb,1);
});
test('all three village gates transfer and return safely',()=>{
  for(const gate of SCENES.village.gates){const s=new Simulation('A');s.go({x:gate.x+gate.w/2,y:gate.y+gate.h/2});for(let i=0;i<4000&&s.map==='village';i++)s.update(.02);assert.equal(s.map,gate.to);assert.equal(blocked(s.scene,s.pos),false);const back=s.scene.gates[0];s.go({x:back.x+back.w/2,y:back.y+back.h/2});for(let i=0;i<4000&&s.map!=='village';i++)s.update(.02);assert.equal(s.map,'village');assert.equal(s.transitions,2);}
});
test('direction signs sit beside their transition gates without blocking the route',()=>{
  for(const scene of Object.values(SCENES))for(const gate of scene.gates){
    const center=gateCenter(gate),marker=gateMarker(gate),foot=gateSignFoot(gate);
    assert.ok(distance(center,marker)<120,`${scene.id} ${gate.id} sign must stay beside gate`);
    assert.ok(foot.x>0&&foot.x<1920&&foot.y>0&&foot.y<1080,`${scene.id} ${gate.id} sign foot in world`);
    assert.equal(blocked(scene,foot),true,`${scene.id} ${gate.id} sign foot collider`);
    const route=findPath(scene,scene.spawn,{x:gate.x+gate.w/2,y:gate.y+gate.h/2});assert.ok(route.length,`${scene.id} ${gate.id} route remains open`);
  }
});
test('every villager patrol is reachable, actually moves, and stays outside solids',()=>{
  const s=new Simulation('D'),travelled=new Map();
  for(const a of s.actors.filter(a=>a.patrol)){
    for(const target of a.patrol){assert.equal(blocked(s.scene,target),false,a.id+' patrol destination');const route=findPath(s.scene,a,target);assert.ok(route.length&&distance(route.at(-1),target)<2,a.id+' patrol route');}
    travelled.set(a.id,0);
  }
  for(let i=0;i<12000;i++){
    const before=s.actors.map(a=>({...a}));s.update(.02);
    for(const [j,a] of s.actors.entries())if(a.patrol){assert.equal(blocked(s.scene,a),false,a.id);travelled.set(a.id,travelled.get(a.id)+distance(a,before[j]));}
  }
  for(const [id,total] of travelled)assert.ok(total>200,id+' cannot remain stuck');
});
test('player routes around an NPC body instead of passing through it',()=>{const s=new Simulation('B');s.pos={x:515,y:490};s.go({x:625,y:490});for(let i=0;i<600;i++){s.update(.016);const healer=s.actors.find(a=>a.id==='healer');assert.ok(distance(s.pos,healer)>=20);}assert.ok(distance(s.pos,{x:625,y:490})<2);});
test('resource and monster bodies also block movement while remaining approachable',()=>{
  for(const [id,radius] of [['ore',12],['stone-beast',20]]){
    const s=new Simulation('A');s.map='mountain';s.loadActors();const actor=s.actors.find(a=>a.id===id);
    s.pos={x:actor.x-90,y:actor.y};const goal={x:actor.x+120,y:actor.y};assert.equal(blocked(s.scene,goal),false);s.go(goal);
    for(let i=0;i<500;i++){s.update(.016);assert.ok(Math.abs(s.pos.x-actor.x)>=radius+10||Math.abs(s.pos.y-actor.y)>=radius+10);}
    assert.ok(distance(s.pos,goal)<2);s.go(actor,id);
    for(let i=0;i<300;i++)s.update(.016);
    assert.ok(id==='ore'?s.bag.ore===1:s.visited.has(id));
  }
});
test('camera pointer inverse is exact at every viewport and DPR',()=>{
  for(const [w,h] of [[1280,720],[1920,1080],[2560,1440],[720,900]])for(const dpr of [1,2])for(const p of [{x:30,y:30},{x:960,y:540},{x:1880,y:1020}]){const camera=cameraFor(w,h,p,dpr),result=toWorld(toScreen(p,camera),camera);assert.ok(distance(result,p)<1e-8);assert.equal(camera.dpr,dpr);}
});
test('all dynamic scene, actor, dialogue, gate and hero keys exist in both languages',()=>{
  for(const lang of ['vi','en']){const messages=JSON.parse(fs.readFileSync(new URL(`../src/locales/${lang}.json`,import.meta.url),'utf8'));for(const scene of Object.values(SCENES)){assert.ok(messages[scene.id]);for(const a of scene.actors){assert.ok(isMonster(a.id)?MONSTERS[a.id].name[lang]:messages[a.id],lang+' '+a.id);if(a.role==='npc')assert.ok(messages[`talk.${a.id}`]);}for(const gate of scene.gates)assert.ok(messages[`gate.${gate.id}`]);}for(const id of ['A','B','C','D'])for(const prefix of ['hero','title'])assert.ok(messages[`${prefix}.${id}`]);}
});

test('selected forest: only the measured wooden deck permits crossing the central stream',()=>{
 const scene=SCENES.forest,pt=(x,y)=>({x:x*1920/1672,y:y*1080/941});
 const start=pt(950,480),goal=pt(650,475),p={...start};
 assert.equal(clearSegment(scene,start,goal),true);
 const route=findPath(scene,start,goal);let crossed=false;
 while(route.length){walk(scene,p,route,3);assert.equal(blocked(scene,p),false);if(waterAt(scene,p)){crossed=true;assert.equal(waterBlocked(scene,p),false);}}
 assert.ok(crossed);assert.ok(distance(p,goal)<1);
 assert.equal(clearSegment(scene,pt(700,540),pt(900,540)),false);
 for(const p of [pt(818,150),pt(810,345),pt(680,635),pt(145,675)])assert.equal(waterBlocked(scene,p),true);
 for(const p of [pt(315,260),pt(535,345),pt(1000,300),pt(1000,690)])assert.equal(blocked(scene,p),true,'house, bamboo, roots and log are solid');
});
test('forest E: every new plant is harvested once, duplicate species share inventory but not cooldown',()=>{
 const s=new Simulation('A');s.map='forest';s.pos={...SCENES.forest.spawn};s.loadActors();
 for(const actor of s.actors.filter(a=>a.itemId)){
  s.go(actor,actor.id);for(let i=0;i<3000&&s.pending;i++){s.update(.016);assert.equal(blocked(s.scene,s.pos),false);}
  const count=s.bag[actor.itemId];assert.ok(count>=1,actor.id);
  s.go(actor,actor.id);for(let i=0;i<10;i++)s.update(.016);assert.equal(s.bag[actor.itemId],count);
 }
 assert.equal(s.bag['spirit-grass'],2);assert.equal(s.bag['dew-flower'],2);
 assert.equal(s.bag['purple-lingzhi'],1);assert.equal(s.bag['jade-herb'],1);
});
