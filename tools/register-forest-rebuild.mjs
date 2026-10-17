import fs from 'node:fs';
import {digest,pngInfo,assetRevision} from './check-game-quality.mjs';
const file='assets/manifest.json',manifest=JSON.parse(fs.readFileSync(file));
const reviewed=new Set(process.argv.filter(s=>s.startsWith('--reviewed=')).flatMap(s=>s.slice(11).split(',')));
const names=['ground-v3','tree-v3','bamboo-v3','blossom-v3','monsters-idle-v4','skill-effects-v4','water-flow-v4'];
const entries=names.map(name=>({id:`production.forest-${name}`,file:`assets/production/forest/${name}.png`,runtime:`game/public/assets/production/forest/${name}.png`,category:name==='ground-v3'?'scene-background':'spritesheet',...(['monsters-idle-v4','skill-effects-v4','water-flow-v4'].includes(name)?{animation:{rectangles:`assets/production/forest/${name}.json`}}:{}),requiresAlpha:!['ground-v3','water-flow-v4'].includes(name)}));
for(const [name,runtime] of [['vegetation-v3','engine/forest-vegetation'],['water-v3','engine/forest-water'],['monsters-idle-v4','engine/monster-idle-frames'],['skill-effects-v4','combat/effect-frames']])entries.push({id:`metadata.forest-${name}`,file:`assets/production/forest/${name}.json`,runtime:`game/src/${runtime}.json`,category:'atlas-metadata'});
entries.push({id:'metadata.forest-water-flow-v4',file:'assets/production/forest/water-flow-v4.json',category:'atlas-metadata'});
for(const e of entries){const bytes=fs.readFileSync(e.file),sha256=digest(bytes),previous=manifest.assets.find(a=>a.id===e.id);if(e.runtime)fs.copyFileSync(e.file,e.runtime);
 const v={...e,...(e.file.endsWith('.png')?pngInfo(bytes):{}),sha256,...assetRevision(previous,sha256,reviewed.has(e.id)),usedBy:['forest-rebuild-2026-10-16'],provenance:e.id.includes('v3')?'Recovered ImageGen assets and measured metadata from interrupted previous chat 01a13f50-fb32-7e62-979b-3021f0456ffb, integrated and reviewed in this rebuild. Exact original prompts were not persisted by that chat.':'Built-in ImageGen; Bright Handheld master reference; measured source rectangles, actual runtime animation/effects.',...(!e.id.includes('v3')?{prompt:e.id.includes('water-flow')?'assets/prompts/forest-water-v4.json':'assets/prompts/forest-rebuild-2026-10-16.json'}:{})};
 if(reviewed.has(e.id))v.review={date:'2026-10-17',scope:'Actual forest runtime plus monster atlas and combat skill renderer; animation regions and reduced motion verified separately.'};
 manifest.assets=manifest.assets.filter(a=>a.id!==e.id);manifest.assets.push(v);
}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log('Registered forest layers, animation, water and skill assets. Explicit review required.');
