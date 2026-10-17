---
name: tien-hiep-monsters
description: Thêm hoặc cân bằng thuộc tính, kỹ năng và AI quái trong Game Tiên Hiệp. Dùng khi chỉnh catalog quái, công thức sát thương hoặc hành vi ra đòn; không dùng cho NPC, lore hay thay bố cục HUD thuần túy.
---

# Quái, kỹ năng và AI

Đọc `ai-workflow/CONTEXT.md`, rồi `ai-workflow/MONSTERS.md` và `ai-workflow/harness/monster-cases.json`. Xác minh source và test thật trước khi sửa. Dùng skill combat-flow khi thay flow vào/ra trận; giữ chính sách lượt và UI B đã duyệt. Ngày 2026-10-12 người dùng cho phép bỏ mockup cho nâng cấp logic/catalog này; đây không phải miễn duyệt mọi UI tương lai.

- Dữ liệu chuẩn tại `game/src/combat/monsters.ts`: tên vi/en, mười chỉ số, sprite, vị trí rừng, hành vi, 3–5 skill/quái. ID là khóa save bền vững. Khi dùng bốn executor có sẵn, thêm catalog là đủ để nối map rừng, dịch tên, AI, renderer và ledger; đừng thêm nhánh theo ID quái trong simulation. Asset mới, cơ chế skill mới hoặc map mới vẫn cần công việc tích hợp tương ứng.
- Chỉ số hồ sơ và combat dùng chung `stats.ts`. Giữ ba công thức gốc và hệ số 1–10 bước 0,5. Dữ liệu skill lưu loại sát thương/hệ số, không lưu damage cố định. Không tự gán hệ tu luyện cho người chơi chỉ từ ngoại hình.
- AI ở `ai.ts`: lọc range/cooldown/tài nguyên trước khi random trọng số; giảm lặp, xét khoảng cách/đỡ/trên không/HP. Dùng RNG có seed để tái hiện test, seed mới mỗi trận runtime. AI chỉ dùng trạng thái quan sát được, không đọc nút tương lai hoặc gọi dịch vụ LLM.
- Khóa mục tiêu/hướng từ báo chiêu tới kết thúc cast. Bảo đảm hình báo khớp hình học va chạm, windup tối thiểu 0,45 giây, vẫn rõ ở chế độ giảm hiệu ứng. Mỗi ground/melee/dash một hit/cast, mỗi projectile một hit, cùng chịu iframe. Không thêm sát thương chạm người thụ động.
- Sát thương theo thứ tự: va chạm hợp lệ → iframe → công thức theo attacker/defender → đỡ → HP/khựng. Snapshot chỉ số khi vào trận. Tốc độ/chính xác/ý chí theo mapping được ghi rõ trong MONSTERS; không gọi các mapping này là công thức do người dùng cung cấp.
- Không đổi ID hoặc xóa save quái để cân bằng. Ledger giữ các ID cũ và tự bổ sung quái mới; khi đổi schema phải kiểm thử migration, không reset túi/lượt.

Chạy `npm run verify` trong `game/` khi nối runtime. Mở rộng `test/monsters.test.mjs` cho công thức, RNG, từng skill và dữ liệu thêm mới; `test/combat.test.mjs` cho input/lượt; `test/browser/combat.spec.ts` cho flow thật. Dùng `node tools/review-monster-skills.mjs` với dev server 4174 để xem warning/active của mọi skill qua renderer thật. Fixture hình ảnh không thay thế test production. Ghi kết quả mới, seed lỗi và giới hạn vào report/harness; không suy kết quả từ lần chạy trước.
