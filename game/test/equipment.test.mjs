import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,CATALOG,validateCatalog,STARTER_ITEMS} from '../src/items/catalog.ts';
import {migrateInventory,applyOperation,parseInventory,resourceCounts} from '../src/items/inventory.ts';
import {effectiveStats} from '../src/items/stats.ts';
import {commitInventory,readInventory,INVENTORY_KEY} from '../src/items/storage.ts';
import {damage,PLAYER_STATS} from '../src/combat/stats.ts';
import {CombatSimulation} from '../src/combat/simulation.ts';
const fresh=()=>migrateInventory({bag:{herb:2},visited:['teacher']});
const equip=(s,id)=>applyOperation(s,{type:'equip',uid:s.slots.find(x=>x?.itemId===id).uid});
const all=s=>[...s.slots.filter(Boolean),...Object.values(s.equipment)].map(x=>x.uid).sort();
const storage=(initial={})=>{const data=new Map(Object.entries(initial));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
test('catalog levels 1–9, slots, bonuses and both locales are validated',()=>{
 validateCatalog(ITEMS);for(const level of [0,10,1.5]){const items=structuredClone(ITEMS);items[0].level=level;assert.throws(()=>validateCatalog(items));}
 for(const change of [i=>i[0].bonuses.attack=Infinity,i=>i[0].slot='helmet',i=>i.push(i[0]),i=>i[0].name.en='']){const items=structuredClone(ITEMS);change(items);assert.throws(()=>validateCatalog(items));}
 assert.equal(CATALOG.constructor,undefined);
});
test('legacy migration preserves materials, only grants starter set once, leaves source intact',()=>{
 const old=JSON.stringify({bag:{herb:210,ore:2},visited:['teacher'],extra:'keep'}),s=storage({'truc-khe.progress':old});
 const first=commitInventory(s),second=commitInventory(s);assert.equal(s.getItem('truc-khe.progress'),old);assert.deepEqual(all(first),all(second));assert.equal(first.slots.length,100);assert.deepEqual(resourceCounts(first),{herb:210,ore:2});assert.equal(first.slots.filter(x=>x?.itemId==='bamboo-sword').length,1);assert.equal(first.equipment.weapon.itemId,'wood-sword');assert.equal(first.slots.filter(x=>x?.itemId==='nine-cloud-robe').length,0);
});
test('migration overflow and unknown IDs are retained without unbounded slot allocation',()=>{
 const s=migrateInventory({bag:{herb:10000,'retired-resource':22}});assert.equal(s.slots.length,100);assert.equal(resourceCounts(s).herb,10000);assert.equal(s.overflow['retired-resource'],22);assert.equal(s.overflow.herb,100);for(const id of STARTER_ITEMS)assert.equal(s.overflow[id],1);
});
test('equip/swap/unequip preserve unique instance identities across 100 cycles',()=>{
 let s=fresh();const ids=all(s);for(let i=0;i<100;i++){s=equip(s,'bamboo-sword');s=equip(s,'wood-sword');s=applyOperation(s,{type:'unequip',slot:'weapon'});s=equip(s,'wood-sword');assert.deepEqual(all(s),ids);}assert.equal(new Set(all(s)).size,all(s).length);
});
test('full bag swap succeeds, unequip and overflow pickup fail without mutating input',()=>{
 const s=fresh();for(let i=0;i<100;i++)s.slots[i]??={uid:`full-${i}`,itemId:'wood-sword',quantity:1};const before=JSON.stringify(s),ids=all(s),next=equip(s,'bamboo-sword');assert.deepEqual(all(next),ids);assert.equal(next.slots.filter(Boolean).length,100);assert.throws(()=>applyOperation(next,{type:'unequip',slot:'weapon'}),/full/);assert.throws(()=>applyOperation(s,{type:'add',itemId:'ore',quantity:1}),/full/);assert.equal(JSON.stringify(s),before);
});
test('stacking fills existing stacks then empty slots; partial fit is rolled back',()=>{
 let s=fresh();s=applyOperation(s,{type:'add',itemId:'herb',quantity:100});assert.deepEqual(s.slots.filter(x=>x?.itemId==='herb').map(x=>x.quantity),[99,3]);for(let i=0;i<100;i++)s.slots[i]??={uid:`full-${i}`,itemId:'wood-sword',quantity:1};const before=JSON.stringify(s);assert.throws(()=>applyOperation(s,{type:'add',itemId:'herb',quantity:100}),/full/);assert.equal(JSON.stringify(s),before);
});
test('claim migration overflow is bounded by free capacity and conserves quantity',()=>{
 const s=fresh();s.overflow.herb=10000;const before=resourceCounts(s).herb,next=applyOperation(s,{type:'claim',itemId:'herb'});assert.equal(resourceCounts(next).herb,before);assert.equal(next.slots.filter(Boolean).length,100);assert.ok(next.overflow.herb>0);
});
test('stats only count equipped gear; reload does not double bonuses',()=>{
 let s=fresh();assert.equal(effectiveStats(s).attack,21);s=equip(s,'bamboo-sword');assert.equal(effectiveStats(s).attack,27);assert.equal(effectiveStats(s).accuracy,19);s=equip(s,'truc-khe-robe');assert.equal(effectiveStats(s).life,128);assert.equal(effectiveStats(s).defense,17);assert.deepEqual(effectiveStats(parseInventory(JSON.stringify(s))),effectiveStats(s));s=applyOperation(s,{type:'unequip',slot:'weapon'});assert.equal(effectiveStats(s).attack,18);
});
test('equipped combat snapshot uses original outgoing/incoming damage formulas, does not mutate base',()=>{
 const s=equip(equip(fresh(),'bamboo-sword'),'truc-khe-robe'),stats=effectiveStats(s),battle=new CombatSimulation('wood-yao',{playerStats:stats});assert.deepEqual(battle.playerStats,stats);assert.equal(battle.maxHp,128);assert.equal(damage(stats,battle.enemyStats,{type:'physical',coefficient:1.5}),30.5);assert.equal(damage(battle.enemyStats,stats,{type:'physical',coefficient:1.5}),10);stats.attack=999;assert.equal(battle.playerStats.attack,27);assert.equal(PLAYER_STATS.attack,18);
});
test('invalid save version, duplicate IDs, wrong equipment, bad quantity are rejected',()=>{
 for(const change of [s=>s.version=2,s=>s.slots.pop(),s=>s.slots[0].quantity=-1,s=>s.equipment.feet=s.equipment.weapon,s=>s.slots[0].uid=s.equipment.weapon.uid]){const s=fresh();change(s);assert.throws(()=>parseInventory(JSON.stringify(s)));}
 for(const legacy of ['bad',{bag:[]},{bag:{herb:-2}}])assert.throws(()=>migrateInventory(legacy));
 const s=fresh();s.slots[0].itemId='retired-item';assert.equal(parseInventory(JSON.stringify(s)).slots[0].itemId,'retired-item');
});
test('malformed and future saves are not overwritten; quota leaves prior save intact',()=>{
 for(const raw of ['broken','{"version":99}']){const s=storage({[INVENTORY_KEY]:raw});assert.throws(()=>commitInventory(s));assert.equal(s.getItem(INVENTORY_KEY),raw);}
 const initial=fresh(),s=storage({[INVENTORY_KEY]:JSON.stringify(initial)});s.setItem=()=>{throw Error('quota');};assert.throws(()=>commitInventory(s,{type:'unequip',slot:'weapon'}),/quota/);assert.deepEqual(readInventory(s),initial);
});
test('latest-state transactions reject stale equip instead of duplicating or overwriting',()=>{
 const initial=fresh(),s=storage({[INVENTORY_KEY]:JSON.stringify(initial)}),uid=initial.slots.find(x=>x?.itemId==='bamboo-sword').uid;commitInventory(s,{type:'equip',uid});const committed=s.getItem(INVENTORY_KEY);assert.throws(()=>commitInventory(s,{type:'equip',uid}),/stale/);assert.equal(s.getItem(INVENTORY_KEY),committed);
});
