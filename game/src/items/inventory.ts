import {CATALOG,SLOTS,STARTER_ITEMS} from './catalog.ts';
import type {Slot} from './catalog.ts';
export const CAPACITY=100;
export type Stack={uid:string;itemId:string;quantity:number};
export type Inventory={version:1;revision:number;slots:(Stack|null)[];equipment:Partial<Record<Slot,Stack>>;overflow:Record<string,number>};
export type Operation={type:'equip';uid:string}|{type:'unequip';slot:Slot}|{type:'add';itemId:string;quantity:number}|{type:'claim';itemId:string};
const clone=(state:Inventory):Inventory=>structuredClone(state);
const positive=(n:unknown):n is number=>Number.isSafeInteger(n)&&Number(n)>0;
export function parseInventory(raw:string):Inventory{
 const state=JSON.parse(raw) as Inventory;
 if(!state||state.version!==1||!Number.isSafeInteger(state.revision)||state.revision<0||!Array.isArray(state.slots)||state.slots.length!==CAPACITY||!state.equipment||typeof state.equipment!=='object'||Array.isArray(state.equipment)||!state.overflow||typeof state.overflow!=='object'||Array.isArray(state.overflow))throw Error('invalid');
 const ids=new Set<string>();
 const check=(stack:Stack,slot?:string)=>{if(!stack||typeof stack.uid!=='string'||!stack.uid||ids.has(stack.uid)||typeof stack.itemId!=='string'||!stack.itemId||!positive(stack.quantity))throw Error('invalid');ids.add(stack.uid);const item=CATALOG[stack.itemId];if(item&&stack.quantity>item.stackMax)throw Error('invalid');if(slot&&(!SLOTS.includes(slot as Slot)||stack.quantity!==1||(item&&item.slot!==slot)))throw Error('invalid');};
 for(const stack of state.slots)if(stack!==null)check(stack);
 for(const [slot,stack] of Object.entries(state.equipment))check(stack,slot);
 for(const [id,count] of Object.entries(state.overflow))if(!id||!positive(count))throw Error('invalid');
 return state;
}
function insert(state:Inventory,itemId:string,quantity:number,uid:()=>string){
 const item=CATALOG[itemId];if(!item)throw Error('unknown');let remaining=quantity;
 for(const stack of state.slots){if(stack?.itemId===itemId){const amount=Math.min(item.stackMax-stack.quantity,remaining);stack.quantity+=amount;remaining-=amount;}}
 for(let i=0;i<CAPACITY&&remaining>0;i++)if(!state.slots[i]){const amount=Math.min(item.stackMax,remaining);state.slots[i]={uid:uid(),itemId,quantity:amount};remaining-=amount;}
 return remaining;
}
export function migrateInventory(legacy:unknown,uid:()=>string=()=>crypto.randomUUID()):Inventory{
 const state:Inventory={version:1,revision:0,slots:Array(CAPACITY).fill(null),equipment:{weapon:{uid:uid(),itemId:'wood-sword',quantity:1}},overflow:Object.create(null)};
 if(legacy!==null&&legacy!==undefined&&(typeof legacy!=='object'||Array.isArray(legacy)))throw Error('invalid');
 const bag=(legacy as {bag?:unknown}|null)?.bag;
 if(bag!==undefined&&(bag===null||typeof bag!=='object'||Array.isArray(bag)))throw Error('invalid');
 for(const [id,count] of Object.entries(bag??{})){if(!Number.isSafeInteger(count)||Number(count)<0)throw Error('invalid');if(count===0)continue;const remaining=CATALOG[id]?insert(state,id,Number(count),uid):Number(count);if(remaining)state.overflow[id]=remaining;}
 for(const id of STARTER_ITEMS){const remaining=insert(state,id,1,uid);if(remaining)state.overflow[id]=(state.overflow[id]??0)+remaining;}
 return parseInventory(JSON.stringify(state));
}
export function applyOperation(previous:Inventory,op:Operation,uid:()=>string=()=>crypto.randomUUID()):Inventory{
 const state=clone(previous);
 if(op.type==='equip'){
  const index=state.slots.findIndex(s=>s?.uid===op.uid);if(index<0)throw Error('stale');const stack=state.slots[index]!,item=CATALOG[stack.itemId];if(!item?.slot)throw Error('unknown');
  state.slots[index]=state.equipment[item.slot]??null;state.equipment[item.slot]=stack;
 }else if(op.type==='unequip'){
  const stack=state.equipment[op.slot];if(!stack)throw Error('stale');const index=state.slots.indexOf(null);if(index<0)throw Error('full');state.slots[index]=stack;delete state.equipment[op.slot];
 }else if(op.type==='add'){
  if(!positive(op.quantity))throw Error('invalid');if(insert(state,op.itemId,op.quantity,uid))throw Error('full');
 }else{
  const count=state.overflow[op.itemId];if(!count)throw Error('stale');const remaining=insert(state,op.itemId,count,uid);if(remaining===count)throw Error('full');if(remaining)state.overflow[op.itemId]=remaining;else delete state.overflow[op.itemId];
 }
 return parseInventory(JSON.stringify(state));
}
export function resourceCounts(state:Inventory){const counts:Record<string,number>={};for(const s of state.slots)if(s&&CATALOG[s.itemId]?.slot===null)counts[s.itemId]=(counts[s.itemId]??0)+s.quantity;for(const [id,n] of Object.entries(state.overflow))if(CATALOG[id]?.slot===null)counts[id]=(counts[id]??0)+n;return counts;}
