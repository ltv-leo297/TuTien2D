import fs from 'node:fs';
import {digest,pngInfo,assetRevision} from './check-game-quality.mjs';
const file='assets/manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const reviewed=new Set(process.argv.filter(v=>v.startsWith('--reviewed=')).flatMap(v=>v.slice(11).split(',')));
const entries=[...['objects','combat'].map(name=>({id:`production.forest-${name}`,file:`assets/production/forest/${name}.png`,runtime:`game/public/assets/production/forest/${name}.png`,category:'spritesheet',requiresAlpha:true})),{id:'metadata.forest-frames',file:'assets/production/forest/frames.json',runtime:'game/src/engine/forest-frames.json',category:'atlas-metadata'},...['spirit-grass','dew-flower','purple-lingzhi','jade-herb'].map(name=>({id:`item.${name}.b1`,file:`assets/production/items/${name}-b1.png`,runtime:`game/public/assets/production/items/${name}-b1.png`,category:'item-icon',requiresAlpha:true}))];
for(const entry of entries){
 const bytes=fs.readFileSync(entry.file);fs.copyFileSync(entry.file,entry.runtime);const sha256=digest(bytes),previous=manifest.assets.find(a=>a.id===entry.id);
 const value={...entry,...(entry.file.endsWith('.png')?pngInfo(bytes):{}),sha256,...assetRevision(previous,sha256,reviewed.has(entry.id)),provenance:'Built-in ImageGen with approved forest E and master Bright Handheld; measured alpha rectangles. Material icons packed from production sprites, not a review board.',prompt:'assets/prompts/forest-E.json',usedBy:['forest-E'],...(entry.category==='spritesheet'?{animation:{rectangles:'assets/production/forest/frames.json'}}:{})};
 if(reviewed.has(entry.id))value.review={date:'2026-10-15',scope:'Production forest, combat and inventory screenshots; source alpha/gutters inspected'};
 manifest.assets=manifest.assets.filter(a=>a.id!==entry.id);manifest.assets.push(value);
}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log('Registered forest E assets; review is explicit.');
