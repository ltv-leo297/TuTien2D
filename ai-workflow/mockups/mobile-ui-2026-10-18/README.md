# UI điện thoại — đề xuất A–E, 2026-10-18

**Trạng thái: người dùng đã chọn A ngày 2026-10-18; cho phép triển khai UI Unity.** Đây là mockup thiết kế ImageGen, không phải ảnh chạy Android/iOS. Yêu cầu: thiết kế lại UI cho điện thoại sau khi ảnh web ở khung điện thoại cho thấy HUD lớn, nút bàn phím và hành trang bị chật chiều cao.

## Phạm vi và nguyên tắc

- Unity mobile nằm ngang; khảo sát khung 844×390 và 915×412 logical px, thêm điện thoại 16:9 và tablet sau khi triển khai. Các board minh họa bố cục, không phải bản đo pixel/safe area đã nghiệm thu.
- Giữ art Bright Handheld B, cảnh khám phá top-down và combat ngang. Cảnh/nhân vật/icon trong board là minh họa; khi code dùng các asset production đã có, không thay bản đồ theo hình được sinh.
- HUD gọn, vùng giữa để quan sát đường đi và báo chiêu. Chạm đất để đi, không tự thêm joystick khám phá hoặc auto combat.
- Chỉ một điểm vào Hành trang. Nhân vật, 10 vị trí trang bị, thuộc tính và túi 100 ô ở các tab bên trong. Túi hiển thị một phần ô có thể cuộn/phân trang, không thu nhỏ cả 100 ô vào một màn điện thoại.
- Bỏ nhãn phím desktop; giữ đủ trái/phải/nhảy/lướt/giữ đỡ/đánh/linh trảm và pause. Không hiện lượt hay thời gian hồi lượt trong combat/kết quả.
- Không thêm tiền tệ, cửa hàng, XP, loot, đổi ngoại hình hoặc cơ chế item theo chi tiết ImageGen tự vẽ. Dùng catalog hiện tại; icon/nội dung/số lượng trong board chỉ minh họa.

## So sánh

| Phương án | Khám phá | Combat | Hành trang | Đánh đổi |
|---|---|---|---|---|
| **A — Hai ngón cái (đề xuất)** | Profile nhỏ, minimap, Hành trang/Nhiệm vụ ở góc dưới phải | Trái/phải bên trái, cụm 5 hành động theo cung bên phải | Tab Nhân vật/Túi đồ; lưới trái, chi tiết phải | Cụm phải cần thử với người có bàn tay nhỏ |
| B — Cảnh chơi rộng | Map thu gọn, Menu mở các chức năng | HUD mỏng, nhóm hành động phải theo hai hàng | Panel trượt bên phải, hai tab, lưới và chi tiết | Thêm một lần chạm để mở Hành trang; pane hẹp hơn A |
| C — Thanh công cụ bên | Ba chức năng ở thanh dọc bên phải | Nhảy cùng cụm hướng bên trái; 4 nút theo lưới bên phải | Tab dọc Túi đồ/Trang bị/Thuộc tính | Dễ tìm chức năng nhưng chiếm bề ngang |
| D — Thanh nút phía dưới | Dock chức năng phía dưới | Một dải điều khiển dưới sân đấu | Tab dưới; lưới trái, chi tiết phải | Vị trí nút đều, giảm chiều cao nhìn thấy của cảnh |
| E — Chữ lớn, dễ chạm | Giảm thông tin, nhãn rõ hơn | Nút lớn, nhảy bên trái; nhóm 4 hành động bên phải | 12 ô/trang, 9 trang cho 100 ô; chi tiết lớn | Xem ít đồ mỗi trang, cần chuyển trang nhiều hơn |

## Tiêu chí cụ thể để triển khai sau chọn

1. Đặt nội dung tương tác trong `Screen.safeArea` với padding bổ sung; nền phủ toàn màn hình. Bản thiết kế lấy khoảng chừa ngang 44 và đáy 20 logical px để minh họa; runtime phải dùng vùng an toàn thật, không hard-code kích thước tai thỏ của một mẫu máy. Hỗ trợ xoay ngang trái/phải, home indicator, màn không cutout.
2. Vùng chạm tối thiểu mục tiêu 48×48 logical px; nút chiến đấu 56–64, Đánh 72; khoảng cách ít nhất 8. Hit target có thể lớn hơn icon nhưng không chồng nhau. Cần xác nhận kích thước vật lý trên thiết bị, không coi pixel trong ảnh mockup là số đo dp.
3. Nhãn chính 14–16 logical px, tiêu đề 18–20; hạn chế text nhiều dòng ngoài map. Số HP/TL/LL trong combat có icon và nhãn trợ giúp, không phân biệt bằng màu đơn thuần. Không dùng font cực nhỏ để giải quyết thiếu chỗ.
4. Màn túi dùng header/tab/đóng cố định, vùng nội dung ở giữa; nút Trang bị cố định trong pane chi tiết. Chỉ grid và nội dung dài cuộn riêng. Không cuộn cả dialog khiến nút đóng/Trang bị biến mất. Với E, trang cuối chỉ có 4 ô hợp lệ, không tăng sức chứa thành 108.
5. Tab Nhân vật giữ 10 slot và các thuộc tính hiện có trong các vùng cuộn riêng; không đặt cả paper doll, 10 thuộc tính, 100 ô và chi tiết cùng một hàng ở chiều cao điện thoại. Duy trì một điểm vào từ map.
6. Điểm vào/ra: Hành trang → chọn món → xem so sánh → Trang bị → cập nhật chỉ số/thông báo thành công → đóng về đúng map/vị trí. Nút đóng luôn ở vị trí ổn định. Không đổi trang bị khi combat.
7. Trạng thái: selected có viền và nền; nút đang giữ có phản hồi; cooldown kỹ năng dùng vòng mờ/nhãn ngắn; chưa đủ tài nguyên có trạng thái disabled đọc được; đầy túi hoặc lưu lỗi có thông báo rõ và giữ dữ liệu, không che nút retry/đóng. Số lượt chỉ ở thẻ quái trước trận.
8. Bàn phím hệ thống khi đặt tên phải để thấy ô nhập và nút xác nhận. Màn tạo nhân vật dùng các lựa chọn đủ lớn, giữ khả năng đổi ngôn ngữ. NPC dùng panel thoại thấp, đóng dễ chạm. Pause/kết quả giữ các lựa chọn hiện có, không tự thêm replay/loot.
9. Chữ/nút/icon runtime là thành phần Unity UI với locale vi/en; không cắt chữ từ mockup. Các màu tối ngọc, chữ kem và nhấn vàng thống nhất. Số Công kích 21 → 27 minh họa thay kiếm gỗ bằng Thanh Trúc Kiếm, không phải buff mới.
10. Kiểm tra sau triển khai: thiết bị thật Android/iOS, nhiều ngón, giữ hướng + nhảy/đánh, cancel/focus/resume, UI không xuyên chạm xuống map, đổi chiều màn hình, iPad, text Anh dài, bàn phím mở, đủ 100 ô và 10 slot, các trạng thái lỗi lưu/túi đầy. Cloud hiện chưa có Editor nên chưa có kết quả nghiệm thu native.

## Nguồn và lưu trữ

- `A.png` … `E.png`: board cuối để chọn. `drafts/`: bản đầu giữ để truy vết, không dùng làm phương án hiện hành.
- `prompts.json`, `refinements.json`, `refinements-DE.json` và các prompt sửa bổ sung: prompt chính xác, reference của từng lần tạo.
- `provenance.json`: đường dẫn output gốc, hash và kích thước của board cuối.
- Reference chính: `assets/references/B-bright-handheld-v1.png`; ảnh web thật trong `/workspace/artifacts/mobile-web-reference/` dùng để đối chiếu lỗi UI cũ.

Điểm dừng duyệt đã hoàn tất: người dùng chọn A. Các phương án B–E và bản draft giữ để tham khảo lịch sử, không tích hợp. Kết quả triển khai/kiểm thử ghi riêng trong `unity/MOBILE-UI.md`.
