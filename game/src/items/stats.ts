import {PLAYER_STATS} from '../combat/stats.ts';
import type {Stats} from '../combat/stats.ts';
import {CATALOG} from './catalog.ts';
import type {Inventory} from './inventory.ts';
export function effectiveStats(inventory:Inventory,base:Readonly<Stats>=PLAYER_STATS):Stats{
 const result={...base};for(const stack of Object.values(inventory.equipment))for(const [key,value] of Object.entries(CATALOG[stack.itemId]?.bonuses??{}))result[key as keyof Stats]+=value;
 return result;
}
