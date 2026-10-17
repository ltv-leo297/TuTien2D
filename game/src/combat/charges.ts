export const CAPACITY=10;
export const RECHARGE_MS=5*60*1000;
export const COMBAT_SAVE='truc-khe.combat.v1';
import {MONSTER_IDS} from './monsters.ts';
import type {MonsterId} from './monsters.ts';
export type {MonsterId} from './monsters.ts';
export {isMonster} from './monsters.ts';
export type ReturnPoint={map:'forest';pos:{x:number;y:number};direction:number};
export type Entry={id:string;startedAt:number;readyAt?:number};
export type Ledger={version:1;monsters:Record<string,Entry[]>;returnTo?:ReturnPoint};
export const emptyLedger=():Ledger=>({version:1,monsters:Object.fromEntries(MONSTER_IDS.map(id=>[id,[]]))});
export function parseLedger(raw:string|null):Ledger{
  if(raw===null)return emptyLedger();
  const v=JSON.parse(raw) as Ledger;
  if(v?.version!==1||!v.monsters||typeof v.monsters!=='object'||Array.isArray(v.monsters))throw new Error('save');
  const ids=new Set<string>();
  // Preserve all saved IDs, including temporarily removed monsters. New catalog IDs start full.
  for(const entries of Object.values(v.monsters)){
    if(!Array.isArray(entries)||entries.length>CAPACITY)throw new Error('save');
    for(const e of entries){if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id)||!Number.isFinite(e.startedAt)||e.startedAt<0||(e.readyAt!==undefined&&(!Number.isFinite(e.readyAt)||e.readyAt<e.startedAt)))throw new Error('save');ids.add(e.id);}
  }
  for(const id of MONSTER_IDS)if(!Object.hasOwn(v.monsters,id))v.monsters[id]=[];
  if(v.returnTo&&(v.returnTo.map!=='forest'||![v.returnTo.pos?.x,v.returnTo.pos?.y,v.returnTo.direction].every(Number.isFinite)))throw new Error('save');
  return v;
}
export const available=(v:Ledger,id:MonsterId,now:number)=>CAPACITY-v.monsters[id].filter(e=>e.readyAt===undefined||e.readyAt>now).length;
export function reserve(v:Ledger,monster:MonsterId,id:string,now:number,returnTo:ReturnPoint):Ledger{
  if(Object.values(v.monsters).flat().some(e=>e.id===id))return v;
  if(Object.values(v.monsters).flat().some(e=>e.readyAt===undefined)||available(v,monster,now)<=0)throw new Error('empty');
  const next=structuredClone(v);next.returnTo=returnTo;
  for(const key of Object.keys(next.monsters))next.monsters[key]=next.monsters[key].filter(e=>e.readyAt===undefined||e.readyAt>now);
  next.monsters[monster].push({id,startedAt:now});return next;
}
export function finish(v:Ledger,id:string,now:number):Ledger{
  const next=structuredClone(v);for(const e of Object.values(next.monsters).flat())if(e.id===id&&e.readyAt===undefined)e.readyAt=Math.max(now,e.startedAt)+RECHARGE_MS;return next;
}
export function recover(v:Ledger,now:number):Ledger{let next=v;for(const e of Object.values(v.monsters).flat())if(e.readyAt===undefined)next=finish(next,e.id,now);return next;}
export const readLedger=()=>parseLedger(localStorage.getItem(COMBAT_SAVE));
export const writeLedger=(v:Ledger)=>localStorage.setItem(COMBAT_SAVE,JSON.stringify(v));
// A held Web Lock covers the entire encounter, including loading and saving the result.
// Other tabs can read counts but cannot start or recover the same active encounter.
export function acquireSession():Promise<null|(()=>void)>{
  if(!navigator.locks)return Promise.reject(new Error('locking'));
  return new Promise((resolve,reject)=>{
    void navigator.locks.request('truc-khe.combat.session',{ifAvailable:true},async lock=>{
      if(!lock){resolve(null);return;}
      await new Promise<void>(release=>resolve(release));
    }).catch(reject);
  });
}
