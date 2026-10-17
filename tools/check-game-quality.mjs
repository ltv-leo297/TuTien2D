import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const digest = (data) => crypto.createHash('sha256').update(data).digest('hex');
// Registration records file integrity. Only explicit visual review can clear this state.
export function assetRevision(previous, sha256, reviewed=false) {
  const changed=!previous||previous.sha256!==sha256;
  return {version:previous?(previous.version+(changed?1:0)):1,qa:reviewed?'runtime-reviewed':changed?'needs-review':previous.qa};
}
export function pngInfo(data) {
  if (data.length < 33 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('PNG không hợp lệ');
  const colorType = data[25];
  let alpha = colorType === 4 || colorType === 6;
  for (let offset = 8; offset + 12 <= data.length;) {
    const size = data.readUInt32BE(offset);
    if (offset + size + 12 > data.length) throw new Error('PNG thiếu dữ liệu');
    if (data.toString('ascii', offset + 4, offset + 8) === 'tRNS') alpha = true;
    offset += size + 12;
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), alpha };
}

export function auditAssets(root, manifest) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(manifest.assets) || !manifest.assets.length) return ['Thư viện không có asset'];
  for (const item of manifest.assets) {
    if (!item.id || ids.has(item.id)) errors.push(`ID trống/trùng: ${item.id}`);
    ids.add(item.id);
    if (!item.category || !item.version || !item.qa || !item.provenance) errors.push(`${item.id}: thiếu metadata`);
    if (item.prompt && !fs.existsSync(path.resolve(root,item.prompt))) errors.push(`${item.id}: thiếu prompt nguồn`);
    if (item.animation?.rectangles && !fs.existsSync(path.resolve(root,item.animation.rectangles))) errors.push(`${item.id}: thiếu metadata frame`);
    for (const relative of [item.file, item.runtime].filter(Boolean)) {
      const absolute = path.resolve(root, relative);
      if (!absolute.startsWith(path.resolve(root) + path.sep)) { errors.push(`${item.id}: đường dẫn ngoài project`); continue; }
      try {
        const bytes = fs.readFileSync(absolute);
        if (digest(bytes) !== item.sha256) errors.push(`${item.id}: hash lệch ${relative}`);
        if (relative.endsWith('.png')) {
          const info = pngInfo(bytes);
          for (const key of ['width', 'height', 'alpha']) if (info[key] !== item[key]) errors.push(`${item.id}: ${key} sai ${relative}`);
        }
      } catch (error) { errors.push(`${item.id}: ${relative}: ${error.message}`); }
    }
    if (!item.file) errors.push(`${item.id}: thiếu file nguồn`);
    if (item.requiresAlpha && !item.alpha) errors.push(`${item.id}: thiếu alpha`);
  }
  return errors;
}

export function localeIssues(vi, en) {
  const flatten = (object, prefix = '') => Object.fromEntries(Object.entries(object).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(flatten(value, name)) : [[name, value]];
  }));
  const a = flatten(vi), b = flatten(en), errors = [];
  const tokens = value => [...String(value).matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(',');
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (typeof a[key] !== 'string' || typeof b[key] !== 'string' || !a[key]?.trim() || !b[key]?.trim()) errors.push(`Locale thiếu/rỗng: ${key}`);
    else if (tokens(a[key]) !== tokens(b[key])) errors.push(`Locale sai biến nội suy: ${key}`);
  }
  if (!Object.keys(a).length) errors.push('Locale rỗng');
  return errors;
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(tsx?|css|json)$/.test(file) ? [file] : [];
  });
}

export function auditRuntime(root) {
  const errors = [];
  const src = path.join(root, 'game/src');
  const ts = createRequire(path.join(root, 'game/package.json'))('typescript');
  // Static signals only; these do not prove localization, collision or camera correctness.
  for (const file of sourceFiles(src)) {
    const text = fs.readFileSync(file, 'utf8');
    if(file.endsWith('.tsx')){
      const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
      const visit=node=>{
        if(ts.isJsxText(node)&&/\p{L}/u.test(node.text.trim()))errors.push(`JSX chưa qua locale: ${path.relative(root,file)}:${ast.getLineAndCharacterOfPosition(node.pos).line+1}`);
        if(ts.isJsxAttribute(node)&&['title','placeholder','aria-label','alt'].includes(node.name.getText(ast))&&node.initializer&&ts.isStringLiteral(node.initializer)&&/\p{L}/u.test(node.initializer.text))errors.push(`Thuộc tính chưa qua locale: ${path.relative(root,file)} ${node.name.getText(ast)}`);
        ts.forEachChild(node,visit);
      };visit(ast);
    }
    text.split('\n').forEach((line, index) => {
      if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(line)) errors.push(`Ký tự ngoài Việt/Anh: ${path.relative(root, file)}:${index + 1}`);
    });
    if (/canvas\s*\{[^}]*object-fit\s*:\s*cover/s.test(text)) errors.push(`Canvas cover làm lệch scale/chuột: ${path.relative(root, file)}`);
  }
  try {
    const vi = JSON.parse(fs.readFileSync(path.join(src, 'locales/vi.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(src, 'locales/en.json'), 'utf8'));
    errors.push(...localeIssues(vi, en));
  } catch (error) { errors.push(`Chưa có cặp locale vi/en hợp lệ: ${error.message}`); }
  try {
    const frames=JSON.parse(fs.readFileSync(path.join(src,'engine/sprite-frames.json'),'utf8'));
    for(const [id,sheet] of Object.entries(frames)){
      const image=pngInfo(fs.readFileSync(path.join(root,`assets/production/${id}.png`)));
      if(sheet.width!==image.width||sheet.height!==image.height||!image.alpha)errors.push(`${id}: metadata spritesheet lệch nguồn`);
      if(sheet.frames.length!==(id==='npcs'?9:id==='villagers'?24:12))errors.push(`${id}: thiếu frame`);
      for(const [x,y,w,h] of sheet.frames)if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>image.width||y+h>image.height)errors.push(`${id}: frame ngoài ảnh`);
    }
    const atlas=JSON.parse(fs.readFileSync(path.join(src,'engine/atlas.json'),'utf8'));
    const structures=JSON.parse(fs.readFileSync(path.join(src,'engine/forest-structures.json'),'utf8'));
    const structuresImage=pngInfo(fs.readFileSync(path.join(root,'assets/production/forest/structures-v2.png')));
    if(structures.rects.length!==2||structures.masks.length!==2||!structuresImage.alpha)errors.push('Forest structures: missing house/bridge or alpha');
    for(const [i,[x,y,w,h]] of structures.rects.entries()){
      if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>structuresImage.width||y+h>structuresImage.height)errors.push('Forest structures: rectangle outside sheet');
      if(!structures.masks[i]||structures.masks[i].length<3||structures.masks[i].some(([px,py])=>!Number.isFinite(px)||!Number.isFinite(py)||px<x||py<y||px>x+w||py>y+h))errors.push('Forest structures: invalid outline mask');
    }
    for(const [name,relative,count] of [['monsters-idle-v4','engine/monster-idle-frames.json',16],['skill-effects-v4','combat/effect-frames.json',8]]){
      const meta=JSON.parse(fs.readFileSync(path.join(src,relative),'utf8')),image=pngInfo(fs.readFileSync(path.join(root,`assets/production/forest/${name}.png`)));
      if(meta.width!==image.width||meta.height!==image.height||!image.alpha||meta.rects.length!==count)errors.push(`${name}: invalid animation metadata`);
      for(const [x,y,w,h] of meta.rects)if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>image.width||y+h>image.height)errors.push(`${name}: frame outside sheet`);
    }
    const combat=JSON.parse(fs.readFileSync(path.join(src,'combat/frames.json'),'utf8'));
    const combatImage=pngInfo(fs.readFileSync(path.join(root,'assets/production/combat-actors.png')));
    if(combat.width!==combatImage.width||combat.height!==combatImage.height||!combatImage.alpha||combat.rows.length!==6)errors.push('Combat: sheet/row metadata invalid');
    combat.rows.forEach((row,index)=>{if(row.length!==6||combat.pivots[index]?.length!==6)errors.push('Combat: missing poses/pivots');for(const [x,y,w,h] of row)if(x<0||y<0||w<=0||h<=0||x+w>combat.width||y+h>combat.height)errors.push('Combat: source rectangle outside sheet');});
    for(const name of ['environment','scenery']){
      const image=pngInfo(fs.readFileSync(path.join(root,`assets/production/${name}.png`)));
      if(atlas[name]?.length!==12)errors.push(`${name}: thiếu vật thể`);
      for(const [x,y,w,h] of atlas[name]??[])if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>image.width||y+h>image.height)errors.push(`${name}: frame ngoài ảnh`);
    }
  } catch(error){errors.push(`Atlas không hợp lệ: ${error.message}`);}
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/manifest.json'), 'utf8'));
    const errors = auditAssets(root, manifest);
    if (!process.argv.includes('--assets-only')) errors.push(...auditRuntime(root));
    const review = manifest.assets.filter(item => item.qa === 'needs-review').length;
    for(const item of manifest.assets)if(item.qa==='needs-review'&&item.usedBy?.length)errors.push(`${item.id}: chưa duyệt hình ảnh runtime`);
    console.log(`${manifest.assets.length} asset; ${review} asset cần review hình ảnh.`);
    errors.forEach(error => console.error(`FAIL: ${error}`));
    console.log(errors.length ? `${errors.length} lỗi. Chưa đạt gate.` : 'PASS: metadata/file checks. Gameplay và chất lượng hình ảnh cần kiểm tra riêng.');
    process.exitCode = errors.length ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
