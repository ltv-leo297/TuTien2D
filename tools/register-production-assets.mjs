import fs from 'node:fs';
import {digest,pngInfo,assetRevision} from './check-game-quality.mjs';
const file='assets/manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const reviewed=new Set(process.argv.filter(v=>v.startsWith('--reviewed=')).flatMap(v=>v.slice(11).split(',')));
function register(entry){const previous=manifest.assets.find(item=>item.id===entry.id);Object.assign(entry,assetRevision(previous,entry.sha256,reviewed.has(entry.id)));manifest.assets=manifest.assets.filter(item=>item.id!==entry.id);manifest.assets.push(entry);}
const frames=JSON.parse(fs.readFileSync('assets/production/sprite-frames.json','utf8'));
for(const name of ['hero-A','hero-B','hero-C','hero-D','npcs','environment','terrain','scenery','villagers','signpost-A']){
  const source=`assets/production/${name}.png`;if(!fs.existsSync(source))throw new Error(`Missing ${source}`);
  const bytes=fs.readFileSync(source),id=`production.${name}`;
  const entry={id,category:name==='signpost-A'?'world-object':name==='environment'||name==='terrain'?'tileset':'spritesheet',file:source,runtime:`game/public/assets/production/${name}.png`,...pngInfo(bytes),requiresAlpha:name!=='terrain',sha256:digest(bytes),provenance:name==='signpost-A'?'Built-in ImageGen; user selected direction-sign mockup A on 2026-10-07.':'Built-in ImageGen with approved B style reference; E layout approved 2026-10-05.',prompt:name==='signpost-A'?'assets/signpost-production-prompt.json':name==='npcs'?'assets/npc-production-prompt.json':name==='terrain'?'assets/terrain-production-prompt.json':'assets/production-prompts.json',usedBy:['scene-01-E','forest','mountain','north'],animation:name.startsWith('hero-')?{directions:['down','left','right','up'],framesPerDirection:3,pivot:'feet',rectangles:'assets/production/sprite-frames.json',frameCount:frames[name].frames.length}:name==='npcs'?{rows:['teacher','healer','smith'],framesPerAction:3,rectangles:'assets/production/sprite-frames.json'}:null};
  if(name==='scenery'||name==='villagers'){
    entry.category=name==='scenery'?'tileset':'spritesheet';
    entry.prompt='assets/scene-e-detail-prompts.json';
    entry.usedBy=['scene-01-E'];
    entry.animation=name==='villagers'?{directions:['down','left','right','up'],characters:['farmer','child'],framesPerDirection:3,frameCount:24,pivot:'feet',rectangles:'assets/production/sprite-frames.json'}:null;
  }
  register(entry);
}
for(const [id,source,runtime,category] of [['audio.ambience','assets/audio/nam-linh-ambience.wav','game/public/assets/production/nam-linh-ambience.wav','audio'],['effects.ambient','assets/effects/ambient-v1.json',null,'effect-preset']]){
  register({id,file:source,runtime,category,sha256:digest(fs.readFileSync(source)),provenance:id.startsWith('audio')?'Original deterministic synthesis; tools/create-ambience.mjs, no external samples.':'Original procedural effect configuration; engine/renderer.ts',usedBy:['scene-01-E']});
}
for(const name of ['atlas','sprite-frames']){const source=`assets/production/${name}.json`;register({id:`metadata.${name}`,category:'atlas-metadata',file:source,runtime:`game/src/engine/${name}.json`,sha256:digest(fs.readFileSync(source)),provenance:'Measured source rectangles from existing production sprites; no image regeneration.',usedBy:['scene-01-E','forest','mountain','north']});}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log(`Registered ${manifest.assets.length} assets.`);
