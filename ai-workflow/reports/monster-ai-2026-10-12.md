# Nâng cấp thuộc tính và AI quái — 2026-10-12

Hoàn tất triển khai trong phạm vi hai quái rừng, desktop Chrome. Người dùng yêu cầu mười thuộc tính như nhân vật, công thức gốc, AI chọn đòn ngẫu nhiên theo chỉ số, 3–5 skill/quái và dữ liệu/hướng dẫn tái sử dụng; đã đồng ý bỏ mockup cho lần này. UI B và quy tắc lượt không đổi.

## Kết quả

- `game/src/combat/monsters.ts`: catalog dễ đọc, bốn skill mỗi quái, tên vi/en, mười stats, level, hình/hitbox/chi phí/cooldown/trọng số/tầm, hành vi và placement rừng. Các nơi dùng tên, ID, vị trí, sprite và lượt đều lấy từ đây. Có validator dữ liệu.
- `stats.ts`: source chung cho hồ sơ và combat; ba công thức gốc vật lý/pháp thuật/kiếm. Người chơi và quái đều áp dụng phòng thủ tương ứng. Snapshot stats khi tạo trận; không tự gán hệ tu luyện cho nhân vật. Giữ số lẻ trước khi đỡ.
- `ai.ts`: RNG seed, lọc điều kiện trước rồi chọn có trọng số theo range/đỡ/trên không/HP; giảm lặp; tài nguyên và cooldown thật. Quái tiến/lùi theo cự ly ưu tiên, khóa hướng/đích ở đầu windup. Không dùng LLM/network hoặc đọc input tương lai.
- `simulation.ts`/`renderer.ts`: bốn executor chung, đạn quét va chạm hai trục, báo chiêu tương ứng hitbox kể cả giảm hiệu ứng; một hit mỗi ground/melee/dash cast, mỗi viên đạn một hit. Bỏ damage va chạm thụ động. Tốc độ/chính xác/ý chí có mapping real-time được phân biệt với công thức gốc.
- Ledger vẫn version 1, tự thêm ID mới, giữ ID cũ/retired và các mốc hồi. Không reset túi/lượt.
- Rule/hướng dẫn: `MONSTERS.md`, `COMBAT_FLOW.md`, AGENTS, README, harness monster/combat; skill mới `.agents/skills/tien-hiep-monsters/SKILL.md` và routing trong combat-flow. Context cũ có ngày và được giữ theo quy ước chỉ cập nhật khi yêu cầu trực tiếp; đọc MONSTERS/COMBAT_FLOW để lấy trạng thái mới.

## Kiểm thử đã chạy

1. `npm run verify`: 45/45 unit, asset/locale 35 mục và 0 pending, build pass, 21/21 browser khi chưa bổ sung hai case mới. Đây là lần regression toàn scene/flow.
2. Sau validator/catalog/test locale và hai case mới: 45/45 unit, asset/locale pass, build pass; lượt browser đầu 11/12 vì test tìm heading “Thất bại” trong khi locale thật là “Bại trận”. Ảnh/error context xác nhận runtime đã kết thúc thua đúng, lỗi thuộc selector test. Đã sửa selector theo locale.
3. Lần cuối `npm run build && npx playwright test test/browser/combat.spec.ts`: 12/12 pass, không skipped/flaky, 126,1 giây; timestamp report `2026-10-12T14:14:40.293Z`. Có full gate→forest→victory→return, spore victory bằng điều khiển thật, idle player chết do AI→return, reload/pause, cross-tab, quota/load failure, vi/en, bốn hero/viewport/DPR và pointer release.
4. Unit mới `game/test/monsters.test.mjs`: 17 case gồm cả tám skill, công thức cả ba loại/minimum/0,5, catalog, range/cooldown/resource gates, 200 seed đa dạng, replay, ưu tiên theo tình huống/chống lặp, khóa đích, jump/dash, stats ảnh hưởng damage/movement, diagonal sweep, pause/end, save bổ sung ID.
5. `node tools/review-monster-skills.mjs`: render đủ 8 skill × warning/active, reduced effects, qua mã thật trên Vite. Đã xem ảnh `monster-skills-2026-10-12.png`. Đây là fixture source để kiểm hình, không được gọi là test production đủ mọi skill.

Hiệu năng production full fight: 1920×1080 DPR1, 301 mẫu sau bỏ 60 mẫu đầu, p95 16,8ms, trung bình 60,003 FPS. Full flow và spore case không có pageerror. Môi trường Chrome headless local; không đại diện điện thoại hoặc tải qua mạng.

Bằng chứng lưu ổn định: `monster-browser-results-2026-10-12.json`, `monster-spore-runtime-2026-10-12.png`, `monster-combat-runtime-2026-10-12.png`, `monster-skills-2026-10-12.png`.

## Giới hạn

Đây là cân bằng ban đầu, chưa playtest dài hạn. Hai quái có sát phạt 0 và chưa dùng chiêu kiếm; công thức kiếm được unit-test, chưa có chọn hệ người chơi. Chính xác người chơi không tung RNG trượt đòn; ngộ tính/căn cốt/tâm cảnh chưa áp dụng cho quái. Chưa có XP/vật phẩm/progression, backend, Firefox/Safari, điện thoại thật hoặc heap audit.

Thêm entry đủ cho quái rừng dùng sprite/executor sẵn. Hình hoàn toàn mới cần asset+metadata; cơ chế skill/map mới cần tích hợp thêm. Không tuyên bố chỉ thêm catalog sẽ tự sinh các phần đó.

Skill validator chuẩn `quick_validate.py` đã thử nhưng môi trường Python thiếu PyYAML (`ModuleNotFoundError: yaml`). Frontmatter/name/description và đường dẫn đã được kiểm tra cục bộ; không coi đó là validator chuẩn đã pass. Không cài dependency ngoài nhu cầu runtime.
