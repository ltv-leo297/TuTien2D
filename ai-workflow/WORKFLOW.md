# Cách dùng AI workflow

`AGENTS.md` ở gốc project là điểm vào để Codex tự đọc `CONTEXT.md` khi làm việc trong folder này.

Khi nhận yêu cầu làm tính năng game, tiếp tục theo `FEATURE_WORKFLOW.md`. Mọi mockup mới dùng `DESIGN_SYSTEM.md`, `TECH_STACK.md` và skill `.agents/skills/tien-hiep-ui-mockups/SKILL.md` để giữ giao diện nhất quán với công nghệ đã chọn.

## Khi bắt đầu tác vụ

1. Đọc `CONTEXT.md`.
2. Nếu trạng thái còn **Chưa có context dự án**, kiểm tra project đã có file nội dung chưa. Nếu có, điền context ngắn gọn theo những gì đã kiểm chứng, rồi đổi trạng thái.
3. Nếu trạng thái là **Đã có context dự án**, giữ nguyên context. Chỉ sửa khi người dùng yêu cầu.
4. Dù đã có context, vẫn đọc các file liên quan đến tác vụ hiện tại trước khi sửa.

## Nội dung nên ghi vào context

- Mục tiêu project và phạm vi sản phẩm.
- Cấu trúc thư mục, các thành phần chính và luồng hoạt động.
- Công nghệ, lệnh chạy/build/test đã xác minh.
- Quy ước hoặc quyết định thiết kế có ảnh hưởng lâu dài.
- Đường dẫn đến file nguồn cho các thông tin quan trọng.

Ghi sự thật ngắn gọn; đánh dấu rõ phần chưa biết. Không chép toàn bộ mã nguồn, nhật ký từng phiên làm việc, bí mật hay thông tin nhạy cảm.
