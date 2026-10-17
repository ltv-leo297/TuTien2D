# Quy trình làm tính năng game

Áp dụng cho mỗi yêu cầu triển khai tính năng. Người dùng đã yêu cầu **duyệt UI trước khi code**. Không tự bỏ qua điểm dừng này. Nếu tính năng thật sự không có giao diện, hỏi người dùng trước khi bỏ qua mockup.

## 1. Hiểu tính năng và vị trí trong game

- Với scene, đọc `SCENE_QUALITY.md` và kiểm tra `assets/manifest.json` trước khi gen. Bộ B là art direction đã duyệt; thay bố cục không phải đổi style.

- Đọc `CONTEXT.md`, `DESIGN_SYSTEM.md`, `TECH_STACK.md`, skill `.agents/skills/tien-hiep-ui-mockups/SKILL.md`, ghi chú thiết kế và các file liên quan. Phân biệt ý tưởng trong tài liệu với phần đã chạy được.
- Xác định người chơi vào tính năng từ đâu, màn hình/luồng chính, cách quay lại và quan hệ với các tính năng đã có.
- Với encounter/combat hoặc map có quái chiến đấu, đọc `COMBAT_FLOW.md`, skill `tien-hiep-combat-flow` và ma trận `harness/combat-cases.json`. Dùng cùng flow đầu/cuối; xác minh trạng thái đã duyệt và các giả định chưa chốt trước khi triển khai.
- Chốt các giả định cần thiết cho mockup; hỏi ngắn gọn nếu thiếu quyết định ảnh hưởng lớn đến UI.

## 2. Làm 5 mockup để chọn

- Theo lựa chọn hiện tại của người dùng: xuất ảnh trực tiếp, không chạy trang/server chỉ để duyệt ảnh. Lưu prompt/reference cùng ảnh. Các yêu cầu kỹ thuật bắt buộc áp dụng cho mọi phương án.

- Mặc định trình bày **5 phương án A–E** cho cùng một tính năng. Mỗi phương án phải xem được bằng hình ảnh hoặc bản preview tương tác; mô tả chữ đơn thuần chưa đủ.
- Cho thấy UI tính năng trong khung giao diện game và ít nhất điểm vào/ra của luồng. Thể hiện trạng thái quan trọng như đang xử lý, thành công, thiếu tài nguyên hoặc lỗi khi phù hợp.
- Năm phương án khác nhau có chủ đích về bố cục, mức ưu tiên thông tin hoặc tương tác, nhưng dùng chung nền tảng đồ hoạ: bảng màu, chữ, icon, khung, nút và điều hướng. Không làm thành năm phong cách game rời rạc.
- Nếu đã có UI được duyệt, các mockup mới phải nối được với điều hướng và thành phần của UI cũ. Nếu chưa có, dùng một bộ quy tắc đồ hoạ tạm thời nhất quán cho cả năm; chưa coi đó là quyết định cuối.
- Nêu ngắn gọn điểm khác nhau và ưu/nhược của từng phương án. Lưu nguồn mockup theo từng tính năng trong `ai-workflow/mockups/<ten-tinh-nang>/` để có thể xem lại.

**Dừng tại đây để người dùng review và chọn A–E hoặc yêu cầu sửa.** Mã dùng riêng để dựng preview được phép; không bắt đầu triển khai tính năng vào game trước khi có lựa chọn rõ ràng.

## 3. Triển khai phương án đã chọn

- Lựa chọn của người dùng có hiệu lực cho toàn bộ phạm vi đã duyệt; không yêu cầu lại mockup chỉ để sửa các lỗi cùng tính năng. Scene 1: E được chọn ngày 2026-10-05 cho cả bảy yêu cầu.

- Ghi lựa chọn và các quyết định hình ảnh được duyệt vào `DESIGN_SYSTEM.md`. Giữ mockup được chọn làm tham chiếu.
- Triển khai luồng hoàn chỉnh trong game: điểm vào, màn hình, tương tác, trạng thái, dữ liệu và đường quay lại. Tái sử dụng thành phần chung; không để giao diện tính năng lệch khỏi các phần đã có.
- Viết kiểm thử có ý nghĩa cho logic hoặc luồng dễ hỏng khi project có hạ tầng kiểm thử; không viết test chỉ lặp lại cấu trúc code.

## 4. Build, chạy và kiểm thử

- Với scene: chạy harness `node tools/check-game-quality.mjs` từ gốc project và kiểm tra va chạm/tìm đường, DPR/resize/chuột, locale và hiệu ứng theo `SCENE_QUALITY.md`. Harness tĩnh không thay test gameplay. Ghi trạng thái chưa đạt, không coi mockup là bản đã sửa.

- Dùng lệnh thật của project để build và chạy game. Nếu project chưa có nền tảng chạy, tạo/phục hồi phần cần thiết để chạy tính năng đã được duyệt trước khi báo xong.
- Tự đi qua luồng người chơi của tính năng trong bản chạy: mở từ điểm vào, dùng chức năng chính, kiểm tra kết quả và quay lại. Kiểm tra thêm các trạng thái biên liên quan như thiếu tài nguyên, dữ liệu rỗng, thao tác lặp hoặc lỗi.
- Với bản web, chạy production build trong trình duyệt thật và kiểm tra thời gian tải, FPS ở khu vực có hiệu ứng, lỗi console và giao diện tại kích thước màn hình đích. Tối ưu asset, map và hiệu ứng nếu kết quả chưa đạt mục tiêu của tính năng.
- Sửa lỗi tìm thấy, build/chạy/kiểm tra lại phần bị ảnh hưởng. Chỉ báo **xong** khi tính năng chạy được và các kiểm tra liên quan đạt.
- Khi tiếp tục ở chat mới, xác minh lựa chọn đã duyệt và trạng thái test từ chat/file thật. Tiếp tục phần còn dở trong phạm vi đã duyệt; không yêu cầu lại lựa chọn đã có. Báo cáo bàn giao phải tồn tại thật, ghi kết quả chạy mới nhất và phần chưa kiểm tra; không chỉ đặt đường dẫn tới báo cáo chưa tạo.
- Khi bàn giao, nêu phương án đã chọn, phần đã làm, lệnh build/run/test và kết quả thực tế. Nếu môi trường hoặc phụ thuộc ngoài ngăn việc chạy, nêu rõ điểm chặn và **không** tuyên bố tính năng đã hoàn tất.
