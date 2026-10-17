import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditAssets, assetRevision, digest, localeIssues, pngInfo } from './check-game-quality.mjs';

test('asset integrity rejects missing files and modified runtime copies', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tien-hiep-quality-'));
  try {
    fs.writeFileSync(path.join(root, 'source.bin'), 'original');
    fs.writeFileSync(path.join(root, 'runtime.bin'), 'original');
    const item = { id: 'hero', category: 'character', version: 1, qa: 'needs-review', provenance: 'fixture', file: 'source.bin', runtime: 'runtime.bin', sha256: digest(Buffer.from('original')) };
    assert.deepEqual(auditAssets(root, { assets: [item] }), []);
    fs.writeFileSync(path.join(root, 'runtime.bin'), 'modified');
    assert.ok(auditAssets(root, { assets: [item] }).some(issue => issue.includes('hash lệch')));
    fs.unlinkSync(path.join(root, 'source.bin'));
    assert.ok(auditAssets(root, { assets: [item] }).some(issue => issue.includes('ENOENT')));
    assert.ok(auditAssets(root, { assets: [item, item] }).some(issue => issue.includes('trùng')));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('locale contract detects missing strings and renamed interpolation variables', () => {
  assert.deepEqual(localeIssues({ game: { hello: 'Chào {name}' } }, { game: { hello: 'Hello {name}' } }), []);
  assert.ok(localeIssues({ hello: 'Chào {name}' }, { hello: 'Hello {player}' }).length);
  assert.ok(localeIssues({ hello: 'Chào' }, {}).length);
  assert.ok(localeIssues({}, {}).length);
});

test('PNG inspector refuses an invalid image', () => {
  assert.throws(() => pngInfo(Buffer.from('not a png')));
});
test('changed assets require review and increment versions; registering does not approve art',()=>{
  const previous={version:2,sha256:'original',qa:'runtime-reviewed'};
  assert.deepEqual(assetRevision(previous,'original'),{version:2,qa:'runtime-reviewed'});
  assert.deepEqual(assetRevision(previous,'changed'),{version:3,qa:'needs-review'});
  assert.deepEqual(assetRevision(undefined,'new'),{version:1,qa:'needs-review'});
  assert.deepEqual(assetRevision({...previous,qa:'needs-review'},'original',true),{version:2,qa:'runtime-reviewed'});
});
