import fs from 'node:fs';
import {digest,pngInfo,assetRevision} from './check-game-quality.mjs';
const file='assets/manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const reviewed=new Set(process.argv.filter(v=>v.startsWith('--reviewed=')).flatMap(v=>v.slice(11).split(',')));
const entries=[
 {id:'reference.forest-selected-2026-10-16',file:'assets/references/forest-selected-2026-10-16.png',category:'reference'},
 {id:'production.forest-landscape-v2',file:'assets/production/forest/landscape-v2.png',runtime:'game/public/assets/production/forest/landscape-v2.png',category:'scene-background'},
 {id:'production.forest-structures-v2',file:'assets/production/forest/structures-v2.png',runtime:'game/public/assets/production/forest/structures-v2.png',category:'spritesheet',requiresAlpha:true,animation:{rectangles:'assets/production/forest/structures-v2.json'}},
 {id:'metadata.forest-structures-v2',file:'assets/production/forest/structures-v2.json',runtime:'game/src/engine/forest-structures.json',category:'atlas-metadata'},
];
for(const entry of entries){
 const bytes=fs.readFileSync(entry.file),sha256=digest(bytes),previous=manifest.assets.find(a=>a.id===entry.id);
 if(entry.runtime)fs.copyFileSync(entry.file,entry.runtime);
 const value={...entry,...(entry.file.endsWith('.png')?pngInfo(bytes):{}),sha256,...assetRevision(previous,sha256,reviewed.has(entry.id)),
  provenance:entry.category==='reference'?'User attached image #1, authoritative correction on 2026-10-16':'ImageGen precise edit of user attachment; landscape without actors/house/bridge; separate structures with measured runtime outline masks.',
  prompt:'assets/prompts/forest-correction-2026-10-16.json',usedBy:['forest-corrected-2026-10-16']};
 if(reviewed.has(entry.id))value.review={date:'2026-10-16',scope:'Compared user reference with actual runtime landscape and bridge crossing screenshots; structures use explicit masks to exclude exterior halo.'};
 manifest.assets=manifest.assets.filter(a=>a.id!==entry.id);manifest.assets.push(value);
}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
console.log('Registered corrected forest assets; visual review remains explicit.');
