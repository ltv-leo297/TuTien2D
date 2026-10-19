import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const script = await readFile(new URL('../Tools/export-web-save.js',import.meta.url),'utf8');
function browser(values) {
  const state={blob:null,downloads:[]};
  const context={Blob,localStorage:{getItem:key=>values[key]??null},
    URL:{createObjectURL:blob=>{state.blob=blob;return 'blob:test';},revokeObjectURL:()=>{}},
    document:{createElement:()=>({click(){state.downloads.push(this.download);}})},setTimeout:()=>{}};
  return {run:()=>vm.runInNewContext(script,context),state};
}
test('portable exporter preserves all six web keys and omits unrelated storage',async()=>{
  const expected={'truc-khe.profile':{name:'Vân Ly',hero:'C'},'truc-khe.progress':{visited:['teacher'],bag:{herb:7}},'truc-khe.inventory.v1':{version:1},'truc-khe.combat.v1':{version:1,monsters:{}},'truc-khe.locale':'en','truc-khe.motion':false};
  const values=Object.fromEntries(Object.entries(expected).map(([key,value])=>[key,JSON.stringify(value)]));values['unrelated-account']='do not export';
  const {run,state}=browser(values);run();assert.deepEqual(state.downloads,['web-save.json']);assert.deepEqual(JSON.parse(await state.blob.text()),expected);
});
test('missing keys are omitted instead of invented',async()=>{
  const {run,state}=browser({'truc-khe.progress':'{"bag":{"herb":3}}'});run();assert.deepEqual(JSON.parse(await state.blob.text()),{'truc-khe.progress':{bag:{herb:3}}});
});
test('malformed stored JSON stops export without downloading a partial save',()=>{
  const {run,state}=browser({'truc-khe.profile':'{"name":"Vân Ly","hero":"C"}','truc-khe.inventory.v1':'broken'});assert.throws(run);assert.equal(state.blob,null);assert.deepEqual(state.downloads,[]);
});
