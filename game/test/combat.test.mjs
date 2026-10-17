import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyLedger,available,reserve,finish,recover,parseLedger,RECHARGE_MS} from '../src/combat/charges.ts';
import {CombatSimulation,FLOOR,ARENA_W} from '../src/combat/simulation.ts';
import {damage,PLAYER_STATS,PLAYER_ATTACK} from '../src/combat/stats.ts';
const origin={map:'forest',pos:{x:820,y:442},direction:0},tick=(s,seconds)=>{for(let i=0;i<seconds*120;i++)s.update(1/120);};
test('charges: view is free, entry spends once, active slot never refills early',()=>{
  const v=emptyLedger();assert.equal(available(v,'wood-yao',0),10);
  const a=reserve(v,'wood-yao','a',1000,origin);assert.equal(available(a,'wood-yao',999999),9);assert.deepEqual(reserve(a,'wood-yao','a',1000,origin),a);assert.equal(available(a,'spore-yao',1000),10);assert.throws(()=>reserve(a,'wood-yao','b',1001,origin));
});
test('charges: independent exact 5-minute boundary and idempotent finish',()=>{
  let v=reserve(emptyLedger(),'wood-yao','a',900000,origin);v=finish(v,'a',1000000);v=finish(v,'a',1100000);v=reserve(v,'wood-yao','b',1110000,origin);v=finish(v,'b',1120000);
  for(const [now,count]of [[1299999,8],[1300000,9],[1419999,9],[1420000,10],[9000000,10]])assert.equal(available(v,'wood-yao',now),count);
});
test('charges: empty pool prevents entry, offline/reload restores due slots, other monster independent',()=>{
  let v=emptyLedger();for(let i=0;i<10;i++){v=reserve(v,'wood-yao',`a${i}`,1000+i,origin);v=finish(v,`a${i}`,2000+i);}assert.equal(available(v,'wood-yao',3000),0);assert.throws(()=>reserve(v,'wood-yao','overflow',3000,origin));assert.equal(available(v,'spore-yao',3000),10);const loaded=parseLedger(JSON.stringify(v));assert.equal(available(loaded,'wood-yao',2000+RECHARGE_MS),1);assert.equal(available(loaded,'wood-yao',2009+RECHARGE_MS),10);
});
test('charges: abandoned encounters recover once, malformed/future saves do not silently reset',()=>{
  const a=reserve(emptyLedger(),'wood-yao','a',1000,origin),b=recover(parseLedger(JSON.stringify(a)),2000);assert.deepEqual(recover(b,9000),b);assert.equal(b.monsters['wood-yao'][0].readyAt,302000);assert.deepEqual(b.returnTo,origin);for(const raw of ['bad','{}','{"version":2}',JSON.stringify({...emptyLedger(),monsters:{'wood-yao':[{}],'spore-yao':[]}})])assert.throws(()=>parseLedger(raw));assert.deepEqual(parseLedger(null),emptyLedger());
});
test('combat: direction, bounded double jump, landing and arena walls',()=>{
  const s=new CombatSimulation('wood-yao');s.enemyTimer=999;s.press('right');tick(s,.5);assert.ok(s.x>380);s.press('jump');tick(s,.1);s.release('jump');s.press('jump');tick(s,.1);s.release('jump');s.press('jump');tick(s,.1);assert.equal(s.jumps,2);s.release('jump');s.release('right');tick(s,2);assert.equal(s.y,FLOOR);assert.equal(s.jumps,0);s.press('left');tick(s,10);assert.equal(s.x,28);s.release('left');s.x=ARENA_W-30;s.press('right');tick(s,.1);assert.equal(s.x,ARENA_W-28);
});
test('combat: pause/clear cancels held input and freezes simulation, no stuck guard',()=>{
  const s=new CombatSimulation('wood-yao');s.press('left');s.press('guard');tick(s,.1);s.pause(true);const old=s.snapshot();tick(s,2);assert.equal(s.time,old.time);assert.equal(s.x,old.x);assert.deepEqual([...s.input],[]);assert.equal(s.guarding,false);s.pause(false);tick(s,.1);assert.equal(s.x,old.x);
});
test('combat: attack is directional, one melee hit per swing, skill costs/cooldown',()=>{
  const s=new CombatSimulation('wood-yao',{seed:1});s.enemyTimer=999;s.x=860;s.enemyX=940;s.face=-1;s.press('attack');tick(s,.3);s.release('attack');assert.equal(s.enemyHp,240);tick(s,.2);s.face=1;s.press('attack');tick(s,.2);s.release('attack');const afterMelee=240-damage(PLAYER_STATS,s.enemyStats,PLAYER_ATTACK);assert.equal(s.enemyHp,afterMelee);tick(s,.15);assert.equal(s.enemyHp,afterMelee);s.press('skill');tick(s,.02);assert.ok(s.mana<48);assert.ok(s.skillCooldown>3);s.release('skill');s.press('skill');tick(s,.01);assert.ok(s.mana>47);s.release('skill');tick(s,.3);assert.equal(s.enemyHp,177);
});
test('combat: frontal guard reduces damage, rear and root attacks bypass it; dodge costs bounded stamina',()=>{
  const s=new CombatSimulation('wood-yao');s.press('guard');tick(s,.02);s.damagePlayer(20,s.x+40,true);assert.equal(s.hp,117);s.invulnerable=0;s.damagePlayer(20,s.x-40,true);assert.equal(s.hp,97);s.invulnerable=0;s.damagePlayer(20,s.x+40,false);assert.equal(s.hp,77);s.release('guard');tick(s,.01);s.invulnerable=0;s.press('dash');tick(s,.02);assert.ok(s.dash>0&&s.stamina<59);s.damagePlayer(99,s.x+40,true);assert.equal(s.hp,77);s.release('dash');s.stamina=0;s.dash=0;s.dashCooldown=0;s.press('dash');tick(s,.01);assert.equal(s.dash,0);
});
test('combat: warnings precede root/shot and motion physically avoids projectiles',()=>{
  const s=new CombatSimulation('wood-yao',{seed:1});s.cooldowns['root-snare']=99;s.enemyTimer=.01;tick(s,.02);assert.equal(s.enemyPhase,'warn-shot');assert.equal(s.shots.length,0);tick(s,1.02);assert.equal(s.enemyPhase,'shoot');assert.ok(s.shots.length>0);
  const shot={id:99,x:s.x-100,y:FLOOR-35,vx:2200,vy:0,r:9,life:1,friendly:false,damage:12,blockable:true,skillId:'seed-volley'};
  s.shots=[shot];s.y=FLOOR-170;s.vy=0;const hp=s.hp;tick(s,.1);assert.equal(s.hp,hp);s.y=FLOOR;s.shots=[{...shot,id:100,x:s.x-50}];tick(s,.05);assert.equal(s.hp,hp-12);
});
test('combat: a real encounter can be won, defeated or retreated, terminal state freezes damage',()=>{
  const win=new CombatSimulation('wood-yao',{seed:1});win.x=win.enemyX-85;win.press('attack');win.press('skill');tick(win,8);assert.equal(win.outcome,'win');const hp=win.hp;win.damagePlayer(999,win.x,false);assert.equal(win.hp,hp);const lose=new CombatSimulation('spore-yao');lose.hp=1;lose.damagePlayer(10,lose.x+20,false);tick(lose,.02);assert.equal(lose.outcome,'lose');const retreat=new CombatSimulation('wood-yao');retreat.press('right');retreat.end('retreat');tick(retreat,1);assert.equal(retreat.outcome,'retreat');assert.equal(retreat.time,0);
});
