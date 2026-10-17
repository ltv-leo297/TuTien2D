// Import the existing prototype assets without modifying the runtime or source images.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, pngInfo } from './check-game-quality.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = path.join(root, 'assets/manifest.json');
if (fs.existsSync(manifestPath)) throw new Error('Thư viện đã tồn tại; cập nhật manifest theo phiên bản, không nhập đè.');
const definitions = [
  { id: 'style.bright-handheld', source: 'ai-workflow/mockups/pixel-art-asset-directions/B-bright-handheld.png', file: 'assets/references/B-bright-handheld-v1.png', category: 'reference', qa: 'approved-style', provenance: 'Built-in ImageGen; bộ B được người dùng chọn.', prompt: null },
  ...['A', 'B', 'C', 'D'].map(id => ({ id: `hero.${id}`, source: `game/public/assets/bright-handheld/hero-${id}.png`, file: `assets/characters/hero-${id}-v1.png`, category: 'character', qa: 'needs-review', provenance: 'Cutout cũ từ board B; chưa có animation nhiều hướng.', prompt: null, requiresAlpha: true, runtime: `game/public/assets/bright-handheld/hero-${id}.png` })),
  ...['smith', 'healer', 'teacher'].map(id => ({ id: `npc.${id}`, source: `game/public/assets/bright-handheld/npc-${id}.png`, file: `assets/npcs/${id}-v1.png`, category: 'npc', qa: 'needs-review', provenance: 'Cutout cũ từ board B; kiểm tra viền/rác/đạo cụ trước khi dùng tiếp.', prompt: null, requiresAlpha: true, runtime: `game/public/assets/bright-handheld/npc-${id}.png` })),
  { id: 'scene.truc-khe.v1', source: 'game/public/assets/bright-handheld/scene-01-truc-khe-map.png', file: 'assets/scenes/truc-khe-map-v1.png', category: 'scene', qa: 'needs-review', provenance: 'Built-in ImageGen tham chiếu B; map cũ bị người dùng yêu cầu sửa scale và chữ nhúng.', prompt: null, runtime: 'game/public/assets/bright-handheld/scene-01-truc-khe-map.png' },
  ...fs.readdirSync(path.join(root, 'game/public/characters')).filter(name => name.endsWith('.png')).map(name => ({ id: `archive.${name.slice(0, -4)}`, source: `game/public/characters/${name}`, file: `assets/archive/characters/${name}`, category: 'archive', qa: 'archived', provenance: 'Asset có sẵn của prototype trước B; không tự tích hợp lại.', prompt: null })),
];
const assets = definitions.map(({ source, ...entry }) => {
  const bytes = fs.readFileSync(path.join(root, source));
  const target = path.join(root, entry.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target) && digest(fs.readFileSync(target)) !== digest(bytes)) throw new Error(`Không ghi đè: ${entry.file}`);
  fs.writeFileSync(target, bytes);
  return { ...entry, version: 1, importedFrom: source, ...pngInfo(bytes), sha256: digest(bytes), usedBy: entry.runtime ? ['prototype-scene-01'] : [], animation: null };
});
fs.writeFileSync(manifestPath, JSON.stringify({ schemaVersion: 1, style: 'B — Bright Handheld', notes: 'prompt null: prompt chính xác của bản cũ chưa được lưu; không bịa lại. Alpha cho biết có kênh transparency, không xác nhận cutout sạch.', assets }, null, 2) + '\n');
console.log(`Đã nhập ${assets.length} asset, giữ nguyên byte và runtime.`);
