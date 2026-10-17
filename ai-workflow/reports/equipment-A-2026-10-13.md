# Trang bị và túi đồ A — 2026-10-13

Người dùng chọn A ngày 2026-10-13. Đã triển khai UI + dữ liệu + lưu + nối chỉ số combat; **chưa làm ngoại hình theo đồ** (phần tùy chọn trong yêu cầu). Không có backend hoặc engine migration.

## Phần đã làm

- Cả nút Nhân vật/Túi đồ mở bảng A: thuộc tính trái, avatar/10 slot giữa, 100 ô và chi tiết phải. Tìm/lọc, cấp 1–9, bonus, chênh lệch với món đang đeo, equip/swap/unequip. Đóng/Esc về map, dừng route/pending và chặn input map khi mở bảng. Header đóng sticky; màn hẹp reflow/cuộn, không ép ba cột gây tràn.
- `game/src/items/catalog.ts`: 13 món trang bị + 6 nguyên liệu, tên/mô tả vi/en, slot/bonus/icon, validator. Nguồn duy nhất để thêm món cùng cơ chế. `STARTER_ITEMS` cấp 10 món cấp 1–4 một lần; kiếm gỗ đã đeo. Món cấp 6/9 chỉ nằm catalog. Không tự thêm drop/shop/nâng cấp.
- `inventory.ts`: instance ID riêng, 100 ô, stack nguyên liệu 99; đổi đồ trong túi đầy giữ đủ item; tháo bị chặn nếu đầy; thêm nguyên liệu lỗi rollback toàn giao dịch. Overflow migration giữ số dư/ID lạ, có UI nhận khi có chỗ; không xóa món lạ.
- `storage.ts`: version/revision, `truc-khe.inventory.v1`, transaction đọc lại dưới Web Locks, commit sau validation. Save lỗi không ghi đè hoặc báo thành công giả. Legacy `truc-khe.progress` giữ bag gốc và visited; ledger lượt độc lập không reset. `sim.bag` trở thành projection resource từ inventory. Thiếu Web Locks báo lỗi thay vì fallback race.
- `items/stats.ts`: base + đồ đang đeo; hồ sơ và CombatFlow dùng chung. Khi vào trận snapshot mới nhất từ save; không đổi ba công thức damage, không tự gán hệ. Ví dụ kiếm gỗ attack21, Thanh Trúc Kiếm attack27/accuracy19. Không đổi đồ trong trận.
- Rule/skill/context/design/harness đã cập nhật trạng thái A. Skill-creator dùng để cập nhật hướng dẫn có phạm vi, routing nguồn thật và giới hạn; không nhân bản số cân bằng vào skill.

## Kiểm thử thực tế

1. Build lần đầu pass, 57/57 unit pass (12 case trang bị mới), 9/9 browser trang bị pass.
2. Full verify lần đầu: unit/assets/build pass, browser31/32. Case thu thập→reload kiểm tra ngay khi mở game thấy resource chưa khôi phục vì đợi effect async. Save vẫn giữ đúng. Sửa Simulation initializer đọc inventory hiện có để khôi phục resource đồng bộ, không đổi assertion nhằm che lỗi.
3. Chỉnh visual sau xem ảnh: giới hạn chiều rộng ô để 100 ô vừa desktop như A; giữ nút đóng khi cuộn; ô trống không tự mang viền selected. Bảo toàn cả key lạ trong migration overflow bằng dictionary không prototype.
4. **Lần cuối `npm run verify`: 57/57 unit, 35 asset + locale check pass/0 pending, TypeScript + Vite build pass, 32/32 browser pass, 0 skipped/0 flaky.** Browser bắt đầu 2026-10-13T14:35:31.849Z, chạy 207,5 giây. Bao gồm 12 combat, 9 equipment, 11 scene.
5. Equipment browser: equip/compare/stats/unequip/search/vi-en/close/reload; full bag swap và chặn tháo; quota rollback; migration10000 resource/overflow và malformed save giữ nguyên; hai tab trang bị khác slot không mất dữ liệu; stats vào combat/retreat giữ đồ; viewport1280×720DPR1,1920×1080DPR2,720×900DPR2,390×844DPR1 không tràn ngang. Duyệt ảnh production A1920×1080 và các viewport nhỏ. Không gọi viewport giả lập là điện thoại thật.
6. Unit trang bị: catalog và level biên, locale, migration/starter một lần, overflow/unknown,100 vòngswap bảo toànuid,full bag/partial-fit rollback,claim bảo toàn số lượng,stats/reload không double bonus,combat snapshot/damage hai chiều,save invalid/quota/stale transaction.
7. Hiệu năng từ full production regression: scene60FPS/p9516,7ms (600 mẫu); combat59,77FPS/p9516,8ms (264 mẫu sau warmup),1920×1080DPR1. Đây là scene/combat, không đo riêng panel hay máy khác.

Bằng chứng ổn định: `equipment-A-browser-2026-10-13.json`, `equipment-A-runtime-2026-10-13.png`. Nguồn test `game/test/equipment.test.mjs`, `game/test/browser/equipment.spec.ts`; ảnh viewport chi tiết ở `game/test-results/` có thể bị lần test sau thay thế.

Server hiện có `http://localhost:4174/` trả200; không mở server mockup mới. Đã yêu cầu mở game trong panel Codex (tool trả queued).

## Giới hạn

- Nhân vật vẫn dùng sprite có trang phục/vũ khí baked. Chưa đổi hình kiếm/áo choàng/giày; UI ghi rõ. `visualId:null` là trạng thái thật, không giả lập đổi màu rồi gọi paper-doll hoàn tất.
- Cân bằng vật phẩm là bản đầu. Accuracy người chơi chưa gây RNG trượt đòn; sát phạt chưa tác động đòn tân thủ vật lý/pháp thuật. Không thêm cơ chế stat mới ngoài mapping hiện có.
- Mỗi combat mới vẫn đầy HP/stamina/mana theo max như trước; chưa có tài nguyên còn lại lưu ngoài trận. Vì không equip trong trận nên không có thao tác tháo/đeo để hồi giữa trận. Quy tắc clamp khi tồn tại world vitals là yêu cầu tương lai, chưa đánh dấu pass.
- Chưa test máy cảm ứng thật, Firefox/Safari, heap, chặn storage read bằng browser fixture, toàn bộ keyboard-only/filter/unknown-item UI. Browser9case không thay unit12case và ngược lại.
- Save ở localStorage theo origin/browser, không cloud sync hay bảo đảm chống xóa dữ liệu. Chưa có PWA để offline boot. Đồ/cơ chế mới ngoài executor/icon có sẵn cần tích hợp tương ứng, không chỉ thêm entry.
- Validator chuẩn của skill chưa khả dụng vì Python thiếu PyYAML theo lần kiểm tra trước; frontmatter/đường dẫn kiểm tra thủ công. Không tuyên bố validator đó pass.
