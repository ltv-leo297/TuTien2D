---
name: tien-hiep-combat-flow
description: Thiết kế hoặc triển khai flow gặp quái, lượt đánh hồi theo thời gian, combat hành động ngang và trở lại map của Game Tiên Hiệp. Dùng cho combat và các encounter tương tự; không dùng cho mọi thay đổi scene hay UI không liên quan chiến đấu.
---

# Flow gặp quái và combat

Đọc `ai-workflow/CONTEXT.md`, xác minh source liên quan rồi đọc `ai-workflow/COMBAT_FLOW.md` (nguồn quy tắc duy nhất) và `ai-workflow/harness/combat-cases.json` (ma trận nghiệm thu, ánh xạ test và giới hạn). Phân biệt yêu cầu đã chốt, giả định đề xuất, mockup đã chọn và gameplay đã triển khai. Trả lời mới của người dùng thay thế giả định cũ; cập nhật trạng thái tương ứng.

Khi sửa thuộc tính, AI hoặc kỹ năng quái, dùng thêm `.agents/skills/tien-hiep-monsters/SKILL.md` và `ai-workflow/MONSTERS.md`. Catalog `game/src/combat/monsters.ts` là nguồn duy nhất của dữ liệu quái rừng; công thức dùng chung ở `stats.ts`, không hard-code sát thương hoặc luân phiên chiêu theo ID.

- Kiểm tra lựa chọn A–E đã có trước khi mở vòng duyệt. Nếu chưa có, theo `ai-workflow/FEATURE_WORKFLOW.md` và skill `tien-hiep-ui-mockups`: 5 ảnh trực tiếp rồi dừng để chọn, không code runtime trước duyệt. Mockup không phải gameplay hoàn tất.
- Giữ flow đầu/cuối: tiếp cận quái hợp lệ → lượt còn lại → tải → trừ đúng một lượt khi vào trận → combat → kết quả đúng một lần → phục hồi map/vị trí. Map mới dùng cùng flow, dữ liệu quái dùng ID ổn định.
- Mốc 10 lượt và 5 phút là yêu cầu ngày 2026-10-11. Đọc chính sách hồi nhiều lượt trong COMBAT_FLOW trước khi code; không tự chuyển giữa hồi độc lập và tuần tự. Hồi lượt theo timestamp bền qua reload, tách đồng hồ combat. Không dùng bộ đếm mỗi frame hoặc `sim.time` làm nguồn hồi lượt.
- B đã chọn với chỉnh sửa: số lượt chỉ xuất hiện ngoài map khi bấm quái. Không hiển thị lượt trong combat/kết quả, không countdown hoặc giải thích hồi lượt cho người chơi. Các khung flow ở ảnh mockup cũ chỉ là tài liệu, không được đưa vào trận. Đây là quyết định đã duyệt; không hỏi chọn lại.
- Giữ art B; khám phá top-down, combat side-view theo yêu cầu. Tra manifest trước khi gen, không dùng sprites đi bộ top-down thay cho toàn bộ animation chiến đấu. HUD/locale thật, không nhúng chữ vào nền.
- Combat input phải hỗ trợ giữ/nhả, nhiều nút đồng thời, pointercancel/blur/tab ẩn; không để input map xuyên qua màn combat. Collision/hitbox, stamina/skill, telegraph, pause và cleanup theo COMBAT_FLOW.
- Dùng runtime React/TypeScript/Canvas 2D hiện có; tách luật/lưu lượt/input/render. Không tự migrate engine hay thêm backend.
- Mở rộng test hiện có `game/test/combat.test.mjs` và `game/test/browser/combat.spec.ts`; timestamp kiểm soát được cho logic, production browser cho flow. `npm run verify` từ `game/`; báo riêng test chưa nối, chưa chạy hoặc fail. Ma trận JSON không thay thế test executable; không đánh dấu test kế hoạch là pass.

Khi thay đổi quy tắc, cập nhật COMBAT_FLOW và harness trước, rồi context/thiết kế nếu người dùng yêu cầu. Giữ skill gọn, không chép lặp mọi con số cân bằng.
