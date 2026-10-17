import {applyOperation,migrateInventory,parseInventory} from './inventory.ts';
import type {Inventory,Operation} from './inventory.ts';
export const INVENTORY_KEY='truc-khe.inventory.v1';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
export function readInventory(storage:StorageLike=localStorage):Inventory{
 const raw=storage.getItem(INVENTORY_KEY);return raw===null?migrateInventory(JSON.parse(storage.getItem('truc-khe.progress')??'null')):parseInventory(raw);
}
// Caller owns the cross-tab Web Lock. Commit only after full validation; preserve old save on errors.
export function commitInventory(storage:StorageLike,op?:Operation){
 const old=readInventory(storage),next=op?applyOperation(old,op):old;next.revision=old.revision+1;const raw=JSON.stringify(next);parseInventory(raw);storage.setItem(INVENTORY_KEY,raw);return next;
}
export async function transactInventory(op?:Operation){
 if(!navigator.locks)throw Error('storage');
 return navigator.locks.request(INVENTORY_KEY,()=>commitInventory(localStorage,op));
}
