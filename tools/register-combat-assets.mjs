import fs from 'node:fs';
import {digest,pngInfo,assetRevision} from './check-game-quality.mjs';
const file='assets/manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const reviewed=new Set(process.argv.filter(v=>v.startsWith('--reviewed=')).flatMap(v=>v.slice(11).split(',')));
for(const name of ['combat-arena','combat-actors','combat-frames']){
  const meta=name==='combat-frames',source=`assets/production/${name}.${meta?'json':'png'}`,bytes=fs.readFileSync(source),id=`production.${name}`,previous=manifest.assets.find(a=>a.id===id),sha256=digest(bytes);
  const entry={id,category:meta?'atlas-metadata':name==='combat-arena'?'scene':'spritesheet',file:source,runtime:meta?'game/src/combat/frames.json':`game/public/assets/production/${name}.png`,...(!meta?pngInfo(bytes):{}),requiresAlpha:name==='combat-actors',sha256,provenance:meta?'Measured alpha bounds and foot pivots; tools/inspect-combat-atlas.py.':'Built-in ImageGen, Bright Handheld reference; combat UI B approved 2026-10-11.',prompt:'assets/combat-production-prompts.json',usedBy:['forest-combat'],...assetRevision(previous,sha256,reviewed.has(id)),...name==='combat-actors'?{animation:{rows:['hero-A','hero-B','hero-C','hero-D','wood-yao','spore-yao'],framesPerRow:6,rectangles:'assets/production/combat-frames.json',pivot:'measured feet'}}:{}};
  manifest.assets=manifest.assets.filter(a=>a.id!==id);manifest.assets.push(entry);
}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log('Registered combat source/runtime assets only.');
