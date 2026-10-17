# Hành trang compact và bản duyệt hình vật phẩm — 2026-10-13

## Phạm vi hoàn thành

- Sửa bố cục A đã duyệt: giảm kích thước/spacing, giữ ba cột từ 681px; ≤680px dùng hai tab nội bộ để không xếp bảng dài. 100 ô trong pane túi. Chi tiết chuyển popover ≤1100px, có nút đóng. Phần dư migration gấp gọn.
- Chỉ một nút ngoài map: Hành trang / Equipment. Nhiệm vụ vẫn riêng. Focus trap bỏ các control đang ẩn và gồm summary của phần dư.
- Không thay catalog, save, công thức/bonus hay sprite nhân vật. Mặc đồ vẫn **chỉ đổi chỉ số**, không đổi hình map/combat.
- Năm board item A–E bằng built-in ImageGen, dùng master B. Lưu ảnh/prompt tại `ai-workflow/mockups/item-art-directions/`; chưa chọn, không dùng làm atlas production. A Mộc mạc là đề xuất, không phải lựa chọn của người dùng.
- Cập nhật skill `tien-hiep-equipment`, AGENTS, EQUIPMENT, DESIGN_SYSTEM; thêm ITEM_ART và harness item-art. CONTEXT không sửa trong lượt này.

## Kiểm thử thực chạy

`cd game && npm run verify`: **PASS**, 57 unit + 33 Chrome production browser; 0 failed/skipped/flaky. Build pass, checker 35 asset hiện có/0 pending (không chứng minh placeholder item đã hoàn thiện).

Equipment có 10 browser case: đeo/tháo/so sánh/stats/reload/locale, bag full/quota, migration/save hỏng, đồng bộ 2 tab, snapshot combat/return, 5 viewport. Assert modal không tràn dọc/ngang, ô thứ 100 trong viewport, quickbar chỉ còn 2 nút (Hành trang và Nhiệm vụ), tab nội bộ trên phone mở được thuộc tính. Viewports: 1280×720 DPR1, 1920×1080 DPR2, 900×700 DPR1, 720×900 DPR2, 390×844 DPR1.

Đã nhìn screenshot thực ở 1280×720, 900×700, 720×900, 390×844; bản lưu ổn định cùng thư mục report có tên `equipment-compact-{width}-2026-10-13.png`. Raw browser report: `equipment-compact-browser-2026-10-13.json`.

Game dev server hiện có `http://localhost:4174/` (Vite, HTTP200). Bản test production chạy tại 4181. Yêu cầu mở tab game trong Codex trả trạng thái queued; không coi đó là bằng chứng người dùng đã nhìn thấy tab.

Skill validator chuẩn không chạy được vì Python thiếu PyYAML (`ModuleNotFoundError: yaml`); không tự cài dependency. Đã đọc lại frontmatter name/description, phạm vi và link tham chiếu; JSON harness/prompt parse thành công. Không gọi đây là validator pass.

## Còn chờ / giới hạn

- Người dùng chọn A–E **hình item** rồi mới tạo PNG alpha riêng và tích hợp. SVG nét viền vẫn tồn tại trong runtime, chưa tuyên bố đã thay.
- Các board có nền/trang trí chỉ phục vụ duyệt; không cắt board có cỏ/đá/khung để giả làm icon sạch. Harness ART-02…06 vẫn planned.
- Không triển khai paper-doll/attachment; visualId vẫn null. Cần base sạch và layer theo pose/hướng nếu người dùng yêu cầu tiếp.
- Không test Safari/Firefox, thiết bị mobile thật hoặc tất cả zoom/màn siêu thấp. Cho phép cuộn dự phòng ở viewport thiếu chiều cao để giữ khả năng thao tác; mô tả item dài có thể cuộn riêng. Những gap equipment đã ghi trước vẫn có hiệu lực.
