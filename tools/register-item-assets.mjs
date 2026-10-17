// Run from project root after copying new ImageGen PNGs into assets/production/items/.
// Registration does NOT approve artwork. --reviewed accepts exact manifest asset IDs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ITEMS} from '../game/src/items/catalog.ts';
import {itemIconUrl} from '../game/src/items/art.ts';
import {digest,pngInfo,assetRevision} from './check-game-quality.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifestFile=path.join(root,'assets/manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const prompt='assets/prompts/items-thanh-truc-B.json';
const prompts=JSON.parse(fs.readFileSync(path.join(root,prompt),'utf8')).prompts;
const reviewed=new Set(process.argv.filter(v=>v.startsWith('--reviewed=')).flatMap(v=>v.slice(11).split(',')));
for(const id of reviewed)if(!ITEMS.some(i=>i.iconAssetId===id))throw Error(`Unknown review ID: ${id}`);
const entries=ITEMS.map(item=>{
 const url=itemIconUrl(item.iconAssetId);if(!url)throw Error(`Invalid icon: ${item.id}`);
 if(!prompts.some(p=>p.id===item.id&&p.prompt?.trim()))throw Error(`Missing exact prompt: ${item.id}`);
 const file='assets/production/items/'+path.basename(url),runtime='game/public'+url;
 const bytes=fs.readFileSync(path.join(root,file)),info=pngInfo(bytes);
 if(!info.alpha)throw Error(`Missing alpha: ${item.id}`);
 const sha256=digest(bytes),previous=manifest.assets.find(a=>a.id===item.iconAssetId);
 const entry={...previous,id:item.iconAssetId,category:'item-icon',file,runtime,...info,requiresAlpha:true,sha256,...assetRevision(previous,sha256,reviewed.has(item.iconAssetId)),provenance:'Built-in ImageGen; approved B Thanh Truc direction and Bright Handheld master reference; individual alpha icon.',prompt,promptKey:item.id,usedBy:['equipment-A'],animation:null};
 if(previous?.sha256!==sha256)delete entry.review;
 return {entry,bytes};
});
for(const {entry,bytes} of entries){
 fs.mkdirSync(path.dirname(path.join(root,entry.runtime)),{recursive:true});
 fs.writeFileSync(path.join(root,entry.runtime),bytes);
 const index=manifest.assets.findIndex(a=>a.id===entry.id);
 if(index<0)manifest.assets.push(entry);else manifest.assets[index]=entry;
}
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
console.log(`Registered ${entries.length} item icons; ${entries.filter(({entry})=>entry.qa==='needs-review').length} need visual review.`);
