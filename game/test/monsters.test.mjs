import test from 'node:test';
import assert from 'node:assert/strict';
import {MONSTERS,MONSTER_IDS,validateMonster} from '../src/combat/monsters.ts';
import {PLAYER_STATS,damage,speedFactor,staggerDuration,aimError} from '../src/combat/stats.ts';
import {candidates,chooseSkill,seededRandom} from '../src/combat/ai.ts';
import {CombatSimulation,FLOOR,segmentHits} from '../src/combat/simulation.ts';
import {parseLedger,available,reserve} from '../src/combat/charges.ts';
const tick=(s,seconds)=>{for(let i=0;i<Math.ceil(seconds*120);i++)s.update(1/120);};
const situation=(overrides={})=>({distance:300,airborne:false,guarding:false,healthRatio:1,stamina:100,mana:100,cooldowns:{},lastSkill:null,...overrides});
function forceNext(id,skillId){
  const s=new CombatSimulation(id,{seed:14}),k=s.definition.skills.find(k=>k.id===skillId);
  s.enemyX=750;s.x=s.enemyX-(k.kind==='melee'?75:k.kind==='dash'?220:300);s.enemyTimer=0;
  for(const other of s.definition.skills)if(other.id!==k.id)s.cooldowns[other.id]=999;
  tick(s,1/120);assert.equal(s.cast?.skill.id,k.id);return s;
}
test('formulas: physical, magic, sword match original arithmetic, minimum and half coefficients',()=>{
  const a={...PLAYER_STATS,attack:20,killingIntent:7},b={...PLAYER_STATS,defense:12,magicResistance:8};
  assert.equal(damage(a,b,{type:'physical',coefficient:1.5}),18);
  assert.equal(damage(a,b,{type:'magic',coefficient:1.5}),22);
  assert.equal(damage(a,b,{type:'sword',coefficient:2}),34);
  assert.equal(damage({...a,attack:19},b,{type:'physical',coefficient:1.5}),16.5);
  for(const type of ['physical','magic','sword'])assert.equal(damage(a,{...b,defense:999,magicResistance:999},{type,coefficient:1}),1);
});
test('catalog: every monster has ten shared stats, 3–5 skills, finite resources and valid art',()=>{
  for(const id of MONSTER_IDS){const m=MONSTERS[id];validateMonster(id,m);assert.deepEqual(Object.keys(m.stats).sort(),Object.keys(PLAYER_STATS).sort());assert.ok(m.art.row>=0&&m.art.row<6);}
  const bad=structuredClone(MONSTERS['wood-yao']);bad.skills[0].damage.coefficient=1.2;assert.throws(()=>validateMonster('bad',bad));
  bad.skills[0].damage.coefficient=1.5;bad.skills[0].mana=10000;assert.throws(()=>validateMonster('bad',bad));
});
test('AI: range, cooldown and affordability are hard gates; no repeat bias overrides eligibility',()=>{
  const m=MONSTERS['wood-yao'];assert.equal(chooseSkill(m,situation({stamina:0,mana:0}),()=>0),null);
  assert.equal(chooseSkill(m,situation({distance:2000}),()=>0),null);
  const only=chooseSkill(m,situation({cooldowns:{'seed-volley':5,'root-snare':5},lastSkill:'trunk-rush'}),()=>0);
  assert.equal(only.id,'trunk-rush');assert.ok(candidates(m,situation({distance:60})).every(c=>c.skill.kind!=='projectile'&&c.skill.kind!=='dash'));
});
test('AI: many seeds produce variety, reproducible choices, anti-repeat and situational preferences',()=>{
  const m=MONSTERS['wood-yao'],seen=new Set();for(let seed=0;seed<200;seed++)seen.add(chooseSkill(m,situation(),seededRandom(seed)).id);assert.equal(seen.size,3);
  const sequence=seed=>{const random=seededRandom(seed);let lastSkill=null;return Array.from({length:30},()=>lastSkill=chooseSkill(m,situation({lastSkill}),random).id);};
  assert.deepEqual(sequence(7),sequence(7));assert.notDeepEqual(sequence(7),sequence(8));
  const weight=(state,id)=>candidates(m,situation(state)).find(c=>c.skill.id===id).weight;
  assert.ok(weight({guarding:true},'root-snare')>weight({},'root-snare'));
  assert.ok(weight({airborne:true},'seed-volley')>weight({},'seed-volley'));
  assert.ok(weight({lastSkill:'seed-volley'},'seed-volley')<weight({},'seed-volley'));
});
for(const id of MONSTER_IDS)for(const skill of MONSTERS[id].skills)test(`executor: ${id}/${skill.id} warns, pays once, locks aim and uses formula`,()=>{
  const s=forceNext(id,skill.id),cast=s.cast,k=cast.skill,initialHp=s.hp;
  assert.ok(s.enemyTimer>=.45);assert.equal(s.enemyStamina,s.enemyStats.stamina-k.stamina);assert.equal(s.enemyMana,s.enemyStats.spiritualPower-k.mana);assert.equal(s.cooldowns[k.id],k.cooldown);assert.equal(s.shots.length,0);
  const target=[cast.targetX,cast.targetY,cast.face,cast.angle];tick(s,.2);assert.equal(s.hp,initialHp);assert.deepEqual([cast.targetX,cast.targetY,cast.face,cast.angle],target);
  tick(s,s.enemyTimer+.02);
  if(k.kind==='projectile'){
    assert.ok(s.shots.length>0);for(const shot of s.shots){assert.equal(shot.damage,damage(s.enemyStats,s.playerStats,k.damage));assert.equal(shot.skillId,k.id);}
    // Move to an actual projectile path. High defense changes real collision damage.
    const shot=s.shots[0];s.x=shot.x+shot.vx/120;s.y=shot.y+38;s.vy=0;s.invulnerable=0;tick(s,1/120);
    assert.equal(s.hp,initialHp-damage(s.enemyStats,s.playerStats,k.damage));
  }else{
    if(k.kind==='dash'||k.pattern==='wave')tick(s,k.duration);
    assert.equal(s.hp,initialHp-damage(s.enemyStats,s.playerStats,k.damage));
    const after=s.hp;s.invulnerable=0;tick(s,.25);assert.equal(s.hp,after,'one hit per cast, not every frame');
  }
});
test('telegraphs: player can leave locked ground/aim, jump a sweep and dash through a rush',()=>{
  const ground=forceNext('wood-yao','root-snare'),target=ground.cast.targetX;ground.x+=200;tick(ground,2);assert.equal(ground.hp,120);assert.equal(ground.decisions[0].targetX,target);
  const projectile=forceNext('wood-yao','seed-volley'),angle=projectile.cast.angle;projectile.y=FLOOR-220;projectile.x+=100;tick(projectile,.2);assert.equal(projectile.cast.angle,angle);
  const melee=forceNext('wood-yao','branch-sweep');tick(melee,melee.enemyTimer-.3);melee.press('jump');tick(melee,.55);assert.equal(melee.hp,120);
  const dash=forceNext('wood-yao','trunk-rush');tick(dash,dash.enemyTimer+.01);dash.x=dash.enemyX;dash.press('dash');tick(dash,.05);assert.equal(dash.hp,120);
});
test('stats: actual monster hit respects player defense; speed, willpower and accuracy have bounded mappings',()=>{
  const s=new CombatSimulation('wood-yao',{seed:1,playerStats:{...PLAYER_STATS,defense:25}});s.cooldowns['root-snare']=999;s.enemyTimer=0;s.x=600;s.enemyX=950;tick(s,.01);tick(s,s.enemyTimer+.02);const shot=s.shots[0];s.x=shot.x+shot.vx/120;s.y=shot.y+38;tick(s,1/120);assert.equal(s.hp,118);
  assert.ok(speedFactor({...PLAYER_STATS,speed:8})<speedFactor(PLAYER_STATS));assert.equal(speedFactor({...PLAYER_STATS,speed:999}),1.5);
  assert.ok(staggerDuration({...PLAYER_STATS,willpower:40})<staggerDuration(PLAYER_STATS));assert.ok(aimError({...PLAYER_STATS,accuracy:40})<aimError(PLAYER_STATS));
  const slow=new CombatSimulation('wood-yao',{seed:1,playerStats:{...PLAYER_STATS,speed:8}}),fast=new CombatSimulation('wood-yao',{seed:1});for(const s of [slow,fast]){s.enemyTimer=999;s.press('right');tick(s,.2);}assert.ok(fast.x>slow.x);
});
test('swept projectile collision includes diagonal crossings and rejects non-intersections',()=>{
  assert.equal(segmentHits(0,0,100,100,50,50,5,5),true);assert.equal(segmentHits(0,0,100,100,50,0,5,5),false);assert.equal(segmentHits(0,0,0,100,0,50,5,5),true);
});
test('AI state and resources freeze on pause, replay with same seed, terminal cleans active hazards',()=>{
  const a=forceNext('spore-yao','spore-fan');a.pause(true);const before=a.snapshot();tick(a,5);assert.deepEqual(a.snapshot(),before);a.pause(false);tick(a,2);a.end('retreat');assert.equal(a.cast,null);assert.equal(a.shots.length,0);const end=a.snapshot();tick(a,2);assert.deepEqual(a.snapshot(),end);
  const replay=()=>{const s=new CombatSimulation('wood-yao',{seed:55});s.invulnerable=999;tick(s,35);return s.snapshot();};assert.deepEqual(replay(),replay());
});
test('ledger: missing new catalog IDs initialize without erasing old or retired monster charges',()=>{
  const v=parseLedger(JSON.stringify({version:1,monsters:{'wood-yao':[{id:'old',startedAt:10,readyAt:1000}],retired:[{id:'retired',startedAt:10,readyAt:1000}]}}));
  assert.equal(available(v,'wood-yao',20),9);assert.equal(available(v,'spore-yao',20),10);assert.equal(v.monsters.retired.length,1);
  const next=reserve(v,'spore-yao','new',30,{map:'forest',pos:{x:800,y:460},direction:0});assert.equal(next.monsters.retired.length,1);assert.equal(v.monsters['spore-yao'].length,0);
});

test('new ground patterns: wave travels through its warned corridor and can be jumped; eruption locks three timed sites',()=>{
 const wave=forceNext('jade-beast','crag-wave'),cast=wave.cast;
 wave.x=cast.x+cast.face*300;tick(wave,wave.enemyTimer+.01);assert.equal(wave.hp,120,'wave must travel, not hit the entire warning corridor');
 tick(wave,.42);wave.press('jump');tick(wave,.6);assert.equal(wave.hp,120,'a timed jump clears the low wave');
 const chain=forceNext('jade-beast','crag-eruption'),target=chain.cast.targetX;
 chain.x=target+220;tick(chain,chain.enemyTimer+chain.cast.skill.duration+.05);assert.equal(chain.hp,120,'moving outside all three locked sites avoids the chain');assert.equal(chain.decisions[0].targetX,target);
});
test('fang slow changes actual movement, expires, and is prevented by guard and invulnerability',()=>{
 const k=MONSTERS['bamboo-serpent'].skills.find(k=>k.id==='fang-bite');
 const a=new CombatSimulation('bamboo-serpent'),b=new CombatSimulation('bamboo-serpent');
 for(const s of [a,b]){s.enemyTimer=999;s.press('right');}
 a.damagePlayer(10,a.x+50,true,k.id,k.slow);assert.equal(a.slowed,1.6);a.stagger=0;
 tick(a,.5);tick(b,.5);assert.ok(a.x<b.x);a.clear();tick(a,1.2);assert.equal(a.slowed,0);
 const guarded=new CombatSimulation('bamboo-serpent');guarded.guarding=true;guarded.damagePlayer(10,guarded.x+50,true,k.id,k.slow);assert.equal(guarded.slowed,0);
 const dodge=new CombatSimulation('bamboo-serpent');dodge.invulnerable=1;dodge.damagePlayer(10,dodge.x+50,true,k.id,k.slow);assert.equal(dodge.slowed,0);assert.equal(dodge.hp,120);
});
test('sequence geometry uses the same locked three sites and activation times as collision',async()=>{
 const {groundHazards}=await import('../src/combat/geometry.ts');const s=forceNext('jade-beast','crag-eruption'),cast=s.cast;
 const sites=groundHazards(cast,true);assert.equal(sites.length,3);assert.ok(sites.every(h=>!h.active));
 tick(s,s.enemyTimer+.01);assert.equal(groundHazards(cast).filter(h=>h.active).length,1);
 const positions=sites.map(h=>h.x);s.x+=400;tick(s,.4);assert.deepEqual(groundHazards(cast).map(h=>h.x),positions);assert.equal(groundHazards(cast)[1].active,true);assert.equal(groundHazards(cast)[0].active,false);
});
