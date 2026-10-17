# Hồ sơ + trang bị + túi đồ — 2026-10-12

**Lịch sử mockup: người dùng chọn A ngày 2026-10-13; đã tích hợp runtime trong `game/src/items/`.** Các số là mẫu cân bằng, không tự cấp 15 loại vật phẩm cho người chơi. Spec/research: `../../EQUIPMENT.md`. Catalog draft: `items.preview.json`.

Brief: Bright Handheld hiện có; túi ở bên phải; 100 vị trí; trang bị quanh avatar; thông tin cấp 1–9/bonus/so sánh; giữ hồ sơ và đường đóng về map. A–E giữ cùng màu/font/icon và viewport 1920×1080, thay bố cục. Dải dưới cùng là mô tả flow, không phải HUD sẽ thêm vào game.

- A: ba cột thuộc tính / nhân vật-trang bị / túi-chi tiết; dễ so sánh, bảng rộng. Đề xuất chọn A.
- B: mở rộng panel phải; nhân vật/trang bị trái, thuộc tính gọn dưới túi; giữ thấy map nhưng chỉ số xa avatar.
- C: nhân vật lớn trái, thuộc tính giữa, túi phải; chi tiết hàng dưới gọn, ít chỗ mô tả.
- D: gộp hồ sơ và trang bị bên trái, ưu tiên vùng túi/chi tiết; mười thuộc tính rút thành hai cột.
- E: 100 ô chia bốn trang 25; dễ bấm từng ô, phải chuyển trang. Chi tiết gọn; bản triển khai cần mở rộng thông tin khi chọn.

Tham chiếu dùng lại: nền `../character-power-hud/scene-clean.png`, sprite `../../../assets/production/hero-A.png`; B Bright Handheld và panel nhân vật đã duyệt. Sprite cũ có đồ baked, không chứng minh thay hình. Icon SVG là glyph UI minh họa, không phải sprite trang bị production. Không dùng ImageGen trong bộ này: cần chữ/số/nút và đúng 100 ô HTML thật.

Nguồn `index.html` + `layout.css`; tương tác chỉ fixture thay kiếm/đóng/Esc/phân trang. Filter/search và đa số món chưa có logic thật. `items.preview.json` là draft thiết kế dễ đọc; preview UI dùng fixture riêng, không gọi đây là catalog runtime đã nối.

Chạy từ gốc: `node ai-workflow/mockups/equipment-inventory/render.mjs` (dùng Playwright có sẵn trong game, Chrome). Mở file://, không dựng server chọn ảnh. Xuất A.png…E.png.

Đã chạy 2026-10-12: cả 5 ảnh đúng 100 DOM slot, 10 equipment slot, không tràn shell; A–D hiện100/E hiện25; fixture equip/close và E chuyển trang pass. Đã xem ảnh và sửa tràn B/C, vị trí slot. Đây không phải build/runtime acceptance; test game theo `../../harness/equipment-cases.json` còn planned.

Skill mới đã kiểm tra thủ công frontmatter/name/description và đường dẫn; `quick_validate.py` chưa chạy được vì Python thiếu PyYAML. Không ghi validator chuẩn là pass. Catalog JSON được parse/kiểm tra ID, cấp, slot, bonus và tên/mô tả hai locale bằng Node.
