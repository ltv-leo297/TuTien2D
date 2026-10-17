# Combat Rừng Thanh Trúc — 5 phương án UI

Ngày 2026-10-11. **Người dùng đã chọn B**, kèm yêu cầu chỉ hiện số lượt ngoài map khi bấm quái; không số lượt trong trận/kết quả, không countdown hoặc giải thích hồi cho người chơi. Các ảnh A–E là lịch sử thiết kế; dải flow phía dưới và ghi chú hồi lượt không phải UI production. Tiến độ triển khai/kiểm thử tại `../../COMBAT_FLOW.md` và báo cáo runtime.

Cùng art B Bright Handheld, cùng cảnh ngang và thao tác; chỉ đổi bố cục và phân cấp. Mỗi ảnh 1920×1200 gồm màn combat và ba trạng thái đi kèm: thẻ quái/đầy lượt, hết lượt, kết quả/quay về. Xem trực tiếp A.png đến E.png, không cần chạy trang chọn.

| Mã | Ý đồ | Đánh đổi |
|---|---|---|
| A | Hành động cổ điển: HP hai góc, nút chia hai bên | Dễ học; HUD chiếm nhiều hơn B |
| B | Sân đấu thoáng: HUD và thanh phím gọn | Hợp desktop; nút nhỏ hơn D |
| C | Đối đầu yêu thú: thanh HP quái giữa trên, chỉ số người chơi dưới trái | Nhấn mạnh đọc nhịp quái; thông tin người chơi xa quái |
| D | Hai cụm điều khiển cảm ứng lớn | Bấm dễ; dành nhiều diện tích dưới cho nút, cần test đa chạm thật |
| E | Tân thủ có cột hướng dẫn né/đỡ/phản công | Rõ cách chơi; vùng nhìn trận hẹp hơn, có nút ẩn hướng dẫn |

Khuyến nghị khởi đầu A nếu ưu tiên web desktop và điều khiển rõ ràng. B phù hợp hơn khi đã quen phím. Có thể chọn bố cục A kết hợp hướng dẫn tạm của E.

`arena-concept.png`: built-in ImageGen tạo từ style reference B; chưa phải production background/sprites. Hero/quái/đạn hiện nhúng trong concept nên **không dùng nguyên ảnh này làm runtime chiến đấu**. Khi triển khai cần lớp nền, nền tảng, actor, hitbox, hiệu ứng và animation tách biệt.

`index.html`: nguồn bố cục HTML/CSS, tất cả chữ/nút thật; file này chỉ phục vụ xuất ảnh tĩnh. `render.mjs` render offline bằng Chrome headless, không mở preview server. Chạy `node ai-workflow/mockups/forest-combat/render.mjs` từ gốc. `render-checks.json` chỉ xác nhận layout ảnh, không xác nhận gameplay.

Prompt đầy đủ và nguồn reference ở `prompt.json`. Quy tắc và phần còn cần chốt ở `../../COMBAT_FLOW.md`; ma trận test kế hoạch `../../harness/combat-cases.json`. Chỉ số 120/80/65 và máu quái/cooldown là minh hoạ, không phải thông số đã cân bằng. Các thẻ phía dưới là các thời điểm khác nhau, không xuất hiện đồng thời trong game.
