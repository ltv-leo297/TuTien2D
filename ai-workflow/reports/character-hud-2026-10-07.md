# Hồ sơ nhân vật và HUD gọn — 2026-10-07

> Lưu ý: lựa chọn vòng sáng C trong báo cáo lịch sử này đã được thay bằng bảng chỉ đường A sau đó trong ngày 2026-10-07. Xem `map-direction-sign-A-2026-10-07.md`.

## Phương án đã duyệt

- Panel B dạng drawer cạnh phải, thêm avatar lớn theo A.
- Lối chuyển map dùng vòng sáng C; tên điểm đến chỉ vẽ khi hover trực tiếp lên vòng.
- Bỏ thẻ nhiệm vụ ngoài HUD và thẻ địa danh giữa phía trên.
- Địa danh/thời tiết chuyển xuống dưới minimap.
- Bảng thoại không xuất hiện lúc vào game hoặc khi bấm mặt đất. Trạng thái đang đi tới chỉ dùng cho NPC/quái đang là đích; hội thoại xuất hiện sau khi tiếp cận thành công.

## Phần đã triển khai

- Drawer Nhân vật có avatar, cấp nhân vật, hệ/cấp tu luyện, 10 thuộc tính nguyên và Ngộ tính/Căn cốt/Tâm cảnh.
- Bổ sung toàn bộ locale Việt/Anh cho dữ liệu mới.
- Vòng cổng dùng cùng tọa độ world/camera với scene; vùng hover và vùng click trùng marker. Click vòng tự tìm đường tới tâm cổng.
- Nhiệm vụ vẫn mở đầy đủ từ nút `Nhiệm vụ` trong quickbar.

Các giá trị thuộc tính hiện là dữ liệu hiển thị ban đầu theo mockup, chưa phải cân bằng chiến đấu đã duyệt.

## Kiểm tra thực tế

Chạy từ `game/`:

```sh
npm run verify
```

Kết quả: 17/17 kiểm thử logic đạt; asset/locale gate đạt; production build đạt; 11/11 kiểm thử Playwright đạt ở 1280×720, 1920×1080 DPR 2, 2560×1440 và 720×900 DPR 2. Luồng kiểm tra gồm drawer/avatar/10 chỉ số, ẩn HUD cũ, hội thoại ẩn khi đổi đích, hover vòng cổng, ba cổng đi/về, click minimap, resize/DPR và locale Việt/Anh.

Ảnh kiểm tra production: `game/test-results/character-panel-B-gate-C.png`.
