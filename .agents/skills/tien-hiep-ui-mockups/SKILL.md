---
name: tien-hiep-ui-mockups
description: Tạo 5 mockup UI có thể xem và so sánh cho tính năng hoặc màn hình của game tiên hiệp 2D trên web trong project này, trước khi triển khai. Dùng khi yêu cầu liên quan đến giao diện game; không dùng cho sửa lỗi thuần logic không đổi UI.
---

# Mockup UI game tiên hiệp web

Quyết định hiện tại: B Bright Handheld là art direction đã duyệt. Đọc `ai-workflow/ART_BIBLE.md` và `ai-workflow/SCENE_QUALITY.md`; tra thư viện `assets/manifest.json`. Người dùng muốn xem 5 ảnh trực tiếp, không chạy trang chọn ảnh riêng. Với mockup bố cục raster dùng ImageGen; chỉ dùng React/CSS khi cần thể hiện UI thật. Giữ chữ production trong locale, không lấy chữ nhúng trên ảnh mockup làm asset runtime.

Đọc `ai-workflow/FEATURE_WORKFLOW.md`, `ai-workflow/DESIGN_SYSTEM.md` và `ai-workflow/TECH_STACK.md` từ gốc project. Giữ điểm dừng để người dùng chọn mockup trước khi code tính năng.

- Lấy UI đã duyệt làm hệ quy chiếu. Nếu chưa có, dựng một hệ hình ảnh tiên hiệp thống nhất cho cả 5 phương án và ghi rõ đó là đề xuất.
- Tạo 5 phương án A–E có thể xem bằng ảnh hoặc preview tương tác. Thay đổi bố cục, phân cấp thông tin hoặc thao tác; giữ chung màu, font, khung, icon, điều hướng và kích thước viewport trong cả bộ.
- Mỗi phương án cho thấy tính năng nối với game ở đâu, màn hình chính hoạt động thế nào và các trạng thái quan trọng. Giữ chữ/số/nút là thành phần thật, hiển thị dấu tiếng Việt rõ ràng; trang trí và ánh sáng không che chức năng.
- Khi cần mockup tương tác, dùng React/TypeScript/CSS, component dùng chung và CSS custom properties. Runtime hiện tại là Canvas 2D; menu và HUD là lớp HTML phía trên. Không tự đổi sang Phaser theo phần stack đề xuất. Không cập nhật React mỗi frame.
- Hiệu ứng trên game map theo renderer thật của project; hiệu ứng trên panel dùng CSS. Trạng thái cơ bản vẫn đọc và dùng được khi bật giảm chuyển động.
- Lưu nguồn và ảnh/preview của từng phương án trong `ai-workflow/mockups/<ten-tinh-nang>/`. Đưa cả 5 phương án cùng phần khác biệt ngắn gọn cho người dùng review; chỉ sau khi người dùng chọn mới tích hợp tính năng.

Với flow gặp quái/chiến đấu, đọc `ai-workflow/COMBAT_FLOW.md` và skill `tien-hiep-combat-flow`. B đã chọn: lượt chỉ hiện ngoài map khi bấm quái; hồi 5 phút chạy ngầm, không countdown hoặc số lượt trong combat/kết quả. Dải trạng thái flow trong ảnh cũ không phải UI trong trận. Combat nhìn ngang theo yêu cầu 2026-10-11; khám phá giữ top-down. Không coi con số cân bằng minh hoạ thành quyết định đã duyệt.

Nếu người dùng đổi nền tảng hoặc project đã có stack khác, theo quyết định mới và cập nhật `TECH_STACK.md`; không tự di chuyển engine khi chưa có yêu cầu.
