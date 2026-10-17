# Tiên Hiệp Pixel — bản chơi thử Cảnh 1

Chạy bằng `npm install && npm run dev`. Bản thử có màn chọn 4 nhân vật và đặt tên, di chuyển bằng chuột, làng Trúc Khê, rừng, núi, đường phía bắc, NPC, quái và tài nguyên.

Scene 1 dùng art direction đã duyệt **B — Bright Handheld**. Master reference, prompt và quy tắc giữ consistency cho các scene sau nằm trong `../ai-workflow/ART_BIBLE.md`.

Bản sửa mới nhất ngày **2026-10-06** đối chiếu trực tiếp ảnh E người dùng gửi: cụm cây/vườn/bờ suối dày và tự nhiên hơn, sân có hàng rào theo phối cảnh, 8 NPC trong đó 5 dân làng đi lại và trò chuyện được. Sửa khung animation dân làng và lỗi kẹt ở góc hàng rào. Ảnh production, kết quả test và các giới hạn nằm tại `../ai-workflow/reports/scene-e-2026-10-06.md`. Xem bản build ở http://localhost:4180/.

Ngày **2026-10-07** bổ sung drawer Nhân vật cạnh phải với avatar, hệ/cấp tu luyện, 10 thuộc tính nguyên và ba căn cơ. HUD nhiệm vụ/địa danh cũ được thu gọn; tên map và thời tiết nằm dưới minimap. Cổng dùng vòng sáng và chỉ hiện tên khi hover. Bảng thoại chỉ hiện khi đang tiếp cận nhân vật hoặc đang hội thoại. Kết quả nằm tại `../ai-workflow/reports/character-hud-2026-10-07.md`.

Ngày 2026-10-05 đã triển khai bố cục **E — Xóm vườn thưa**, giữ art style B. Nhà/cây/nhân vật là lớp riêng, có collider và sắp xếp trước/sau theo chân. Click tìm đường vòng, bản đồ nhỏ cũng nhận click. Nhân vật có 4 hướng × 3 frame; NPC làm việc/đi lại; cây, nước, khói, lửa, lá và bướm có chuyển động. Nhãn/câu thoại đầy đủ vi/en; đổi tại Tùy chọn. Có túi nguyên liệu, cooldown thu thập, nhiệm vụ gặp ba NPC, lưu hành trang trên thiết bị và âm thanh môi trường bật theo lựa chọn.

## Chạy và kiểm tra

Từ `game/`:

```sh
npm install
npm run dev -- --port 4174
npm run verify
```

Harness yêu cầu Node 24+ (chạy trực tiếp module TS), Chrome cài sẵn cho Playwright. Nếu dùng browser Playwright: `npx playwright install chromium`, rồi `PW_CHANNEL=chromium npm run test:browser`. `verify` chạy unit tests, kiểm tra asset/locale, build và kiểm thử production trong browser ở cổng 4181. Báo cáo/ảnh nằm ở `test-results/`.

`?debug=1` bật snapshot đọc dành cho kiểm thử; `?colliders=1` hiện vật cản. Mặc định cả hai tắt. Art nguồn, prompt, âm thanh, cấu hình hiệu ứng: `../assets/`; metadata ở `src/engine/atlas.json`, `sprite-frames.json`. Không chia đều ảnh AI để cắt sprite nếu chưa kiểm tra khung thực tế.

Lượt hoàn thiện 2026-10-05: suối liên tục, chỉ mặt cầu đi được; collider phủ chân nhà, bụi trúc, đá, giếng và body NPC/quái/tài nguyên. Khi một mặt tiếp cận bị chặn, nhân vật tìm mặt khác để tương tác. Metadata nguồn cũng có trong `../assets/production/`; manifest gồm 29 mục và công cụ đăng ký giữ trạng thái cần review khi đổi hash. Kết quả và ảnh bàn giao: `../ai-workflow/reports/scene-01-e-2026-10-05.md`.

## Combat B — 2026-10-11

Tới Rừng Thanh Trúc, bấm Mộc Yêu non hoặc Bào Tử Yêu, tiếp cận rồi chọn Chiến đấu. Thẻ quái chỉ hiện số lượt còn lại; trong trận/kết quả không có số lượt và không nơi nào hiển thị thời gian hồi lượt. Trận kết thúc trở về đúng vị trí rừng, giữ túi/tiến trình.

Điều khiển: A/D hoặc ←/→ di chuyển; Space nhảy (hai lần); J tấn công; giữ K đỡ; Shift lướt né; L kỹ năng; Esc tạm dừng. Có các nút tương ứng trên màn hình. Quái có báo chiêu trước đạn và đòn mặt đất; rút lui cần xác nhận.

Quy tắc kỹ thuật, lưu lượt và luồng tái sử dụng nằm ở `../ai-workflow/COMBAT_FLOW.md`; báo cáo kiểm thử/ảnh thật: `../ai-workflow/reports/forest-combat-B-2026-10-11.md`. Combat dùng asset ngang riêng, đã kiểm tra alpha/crop và 4 ngoại hình trong runtime.

Phần thưởng XP/vật phẩm sau combat và chọn hệ tu luyện chưa tích hợp. Lưu hiện tại bằng localStorage trên thiết bị, chưa có tài khoản/cloud save hoặc chống chỉnh đồng hồ. Kết quả tải localhost không đại diện cho mạng di động. Chưa xác nhận tương thích Firefox/Safari hay thiết bị di động thật.

## Thuộc tính và AI quái — 2026-10-12

Chỉnh quái tại `src/combat/monsters.ts`: tên Việt/Anh, vị trí rừng, mười chỉ số, sprite, hành vi và bốn skill mỗi quái. Thêm entry dùng bốn kiểu skill có sẵn tự nối map rừng, dịch tên, combat và lượt đánh. Không cần thêm nhánh ID vào AI/simulation. Hướng dẫn và giới hạn khi thêm asset/cơ chế/map mới: `../ai-workflow/MONSTERS.md`.

Hồ sơ nhân vật và combat dùng chung `src/combat/stats.ts`. Công thức vật lý/pháp thuật/kiếm theo ghi chú gốc; AI chọn chiêu theo trọng số, cooldown, tài nguyên và tình huống, khóa mục tiêu khi báo. Dữ liệu lượt cũ được giữ. Skill tái sử dụng: `../.agents/skills/tien-hiep-monsters/SKILL.md`; test: `test/monsters.test.mjs`, `test/browser/combat.spec.ts`.
