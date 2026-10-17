---
name: tien-hiep-scene-quality
description: Xây dựng hoặc sửa scene Game Tiên Hiệp với va chạm, camera web, locale Việt/Anh, hiệu ứng và thư viện asset B. Dùng cho map hoặc lỗi di chuyển/hiển thị trong scene; không dùng cho tài liệu cốt truyện thuần văn bản.
---

# Chất lượng scene Tiên Hiệp

Đọc `ai-workflow/CONTEXT.md` trước, xác minh mã thật và đọc phần liên quan trong `ai-workflow/SCENE_QUALITY.md`. Giữ bước duyệt trong `ai-workflow/FEATURE_WORKFLOW.md`; skill này không cấp quyền bỏ qua mockup.

- Tra `assets/manifest.json` và `ai-workflow/ART_BIBLE.md` trước khi tạo hình. B Bright Handheld là style duy nhất đã chọn. Duyệt bố cục bằng 5 ảnh trực tiếp, không chạy trang duyệt riêng.
- Collider/nav/cổng khớp artwork. Tìm đường quanh vật cản, không cắt góc; kiểm tra chân từng bước. Tương tác khi tiếp cận, ghi nhận một lần.
- Tách world/camera/CSS/DPR; chuột dùng nghịch đảo transform vẽ. Không phóng canvas bằng cover. Giữ scale theo mockup đã duyệt.
- Mọi chữ lấy từ vi/en locale, kể cả canvas/lời thoại. Không dùng Hán tự làm icon hoặc nhúng chữ vào asset.
- Hiệu ứng gắn đúng vật thể, giới hạn hạt/cleanup/giảm chuyển động. Test production và đo hiệu năng thực.
- Lưu nguồn/prompt/metadata/phiên bản; kiểm tra alpha và pixel ở scale gameplay. Chạy `node tools/check-game-quality.mjs` rồi test thực tế phần sửa theo chuẩn scene. Ghi rõ gate chưa đạt.

## Harness thực tế

- Khi scene nối với combat: áp dụng `tien-hiep-combat-flow`, đọc `ai-workflow/COMBAT_FLOW.md` và `ai-workflow/harness/combat-cases.json`. Test trọn đường tiếp cận quái → vào trận → kết quả → về map/vị trí, cả lượt hồi sau reload. Ma trận hiện là kế hoạch, không phải test đã chạy. Combat side-view là ngoại lệ được yêu cầu cho góc nhìn; không đổi art B hay camera khám phá.

- Scene E đã được chọn 2026-10-05. Các sửa lỗi trong phạm vi bảy yêu cầu không cần làm lại năm mockup. Chỉ mở vòng duyệt mới khi có thay đổi giao diện ngoài phạm vi đã duyệt.
- Module thật: `game/src/engine/scene.ts` (props/collider/gates), `navigation.ts` (A* và swept collision), `simulation.ts` (di chuyển/tương tác), `camera.ts`, `renderer.ts`; bản dịch ở `game/src/locales/`.
- Chạy từ `game/`: `npm run verify` (unit + thư viện/locale + build + browser). Browser mặc định Chrome; dùng `PW_CHANNEL=chromium` khi đã cài browser Playwright. Kết quả và ảnh ở `game/test-results/`.
- Test đường đi phải kiểm tra từng đoạn/từng bước, cả đường vòng và điểm không tới được; test ba cổng đi/về và điểm spawn. Không thay collider để chỉ làm test xanh nếu hình ảnh vẫn bị xuyên.
- Ảnh AI không bảo đảm lưới đều: kiểm tra alpha và source rectangles thực. `tools/inspect-atlas.py` chỉ đọc pixel để ghi metadata, không sửa ảnh. Dùng `sprite-frames.json` và `atlas.json` để render, giữ pivot chân ổn định. Không cắt bằng phép chia đều nếu frame lệch.
- Debug `?debug=1` chỉ cung cấp snapshot đọc cho harness, `?colliders=1` vẽ vật cản; mặc định tắt. Đo FPS sau giai đoạn tải/warmup, ghi viewport/DPR/browser và p95; không dùng FPS đầu tải làm kết quả steady-state.
- Khi thêm asset: lưu nguồn và prompt, bản runtime và metadata; cập nhật manifest, so hash. Không đánh dấu asset cũ còn dùng là archived để né kiểm tra.
- Cầu: nước liên tục bên dưới; chỉ polygon mặt cầu cho phép đi. Đo polygon trên atlas, dùng cùng transform với sprite. Vẽ mặt cầu dưới chân nhân vật. Không mở cả dải đất theo chiều ngang để làm đường đi qua nước.
- Body của NPC, quái và tài nguyên cũng tham gia tìm đường. Test thêm đích bị bao kín, đổi đích liên tục và đi qua cầu trong production; test resize ngay trong lượt chơi, không chỉ tải trang ở viewport khác.
- Collider nhà phải phủ cả phần chân công trình/đồ vật bên cạnh; bụi trúc có nhiều gốc, không dùng hitbox thân cây đơn. Nếu phía trước NPC/tài nguyên bị chặn, tìm vị trí tiếp cận hợp lệ ở phía khác. Kiểm tra cả vị trí actor và điểm tương tác nằm ngoài scenery; dời actor bị mắc trong đá thay vì thu nhỏ đá để test qua.
- Metadata nguồn nằm tại `assets/production/{atlas,sprite-frames}.json`; bản runtime tại `game/src/engine/` phải cùng hash. Đăng ký file mới hoặc đổi hash tự tăng phiên bản và đặt `needs-review`. Chỉ sau khi xem ảnh runtime mới chạy `node tools/register-production-assets.mjs --reviewed=<ID,...>` cho đúng các ID đã xem. Harness chặn asset đang dùng chưa được review.
