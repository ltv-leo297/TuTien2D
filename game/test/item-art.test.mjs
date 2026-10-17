import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ITEMS,validateCatalog} from '../src/items/catalog.ts';
import {itemIconUrl} from '../src/items/art.ts';
import {digest,pngInfo} from '../../tools/check-game-quality.mjs';

test('every catalog item resolves a registered alpha icon with identical source/runtime bytes',()=>{
 const root=fileURLToPath(new URL('../../',import.meta.url));
 const manifest=JSON.parse(fs.readFileSync(root+'assets/manifest.json','utf8'));
 const refs=new Set();
 for(const item of ITEMS){
  const url=itemIconUrl(item.iconAssetId),asset=manifest.assets.find(a=>a.id===item.iconAssetId);
  assert.ok(url&&asset,item.id);assert.equal(asset.runtime,'game/public'+url);
  assert.equal(asset.requiresAlpha,true);
  const source=fs.readFileSync(root+asset.file),runtime=fs.readFileSync(root+asset.runtime);
  assert.equal(digest(source),asset.sha256);assert.equal(digest(runtime),asset.sha256);
  assert.equal(pngInfo(source).alpha,true);assert.ok(!refs.has(url),'unexpected duplicate item art');refs.add(url);
 }
});
test('icon references reject paths, URLs and missing metadata instead of guessing an image',()=>{
 for(const value of [undefined,'','../wood','https://example.com/icon.png','item.../secret.b1','item.wood-sword.b1/extra','constructor'])assert.equal(itemIconUrl(value),null);
 assert.equal(itemIconUrl('item.wood-sword.b1'),'/assets/production/items/wood-sword-b1.png');
 const invalid=structuredClone(ITEMS);delete invalid[0].iconAssetId;assert.throws(()=>validateCatalog(invalid),/icon-asset/);
});
