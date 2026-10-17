import vi from './locales/vi.json';
import en from './locales/en.json';
import {MONSTERS,isMonster} from './combat/monsters.ts';
import type {MonsterId} from './combat/monsters.ts';
export type Locale = 'vi'|'en';
export type TextKey = keyof typeof vi|MonsterId;
export type Message = { key: TextKey; args?: Record<string,string|number>; nameKey?: TextKey };
export function translate(locale:Locale,key:TextKey,args:Record<string,string|number>={}) {
  const template=isMonster(key)?MONSTERS[key].name[locale]:(locale==='en'?en:vi)[key as keyof typeof vi]??vi[key as keyof typeof vi];
  return template.replace(/\{(\w+)\}/g,(_,name:string)=>String(args[name]??''));
}
