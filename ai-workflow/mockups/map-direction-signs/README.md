# Bảng chỉ đường chuyển map — mockup A–E

Ngày tạo: 2026-10-07. Đây là vòng duyệt UI, chưa tích hợp vào game.

- **A — Bảng liền mũi tên:** tên điểm đến luôn hiện; đọc nhanh nhất, nhưng chiếm diện tích lớn hơn.
- **B — Bảng treo tương tác:** bảng có cảm giác sống trong thế giới; trạng thái hover sáng rõ, nhưng chi tiết dây treo có thể hơi nhiều khi thu nhỏ.
- **C — Trụ hai tầng:** tách bảng tên và mũi tên, silhouette rõ nhất từ xa; cao hơn và dễ che cảnh.
- **D — Biển thấp mép đường:** ít che map nhất; cần tăng nhẹ khi hover/đến gần để đọc tốt.
- **E — Bảng sáng nhẹ khi tương tác:** giữ bảng nhỏ như vật thể môi trường, chỉ thêm viền sáng rất nhẹ khi có thể nhấp.

Vòng chỉnh sửa 2: thu bảng xuống gần kích thước một NPC và cắm trên mảng đất ngay sau đầu cầu; bỏ callout, con trỏ minh hoạ và vệt chevron khỏi scene.

Vòng chỉnh sửa 3: thu thêm khoảng 15%, bỏ ký tự mũi tên chồng trên asset, cho tên điểm đến xuống hai dòng và ẩn toàn bộ nhãn review trong khung game để tránh cảm giác UI bị vỡ.

Chữ địa danh là HTML/CSS thật trong mockup, không nhúng vào ảnh bảng. Khi triển khai sẽ dùng locale Việt/Anh và đổi chiều mũi tên theo từng `gate`.

Asset nguồn raster trong suốt được tạo bằng built-in ImageGen với ảnh bảng gỗ người dùng gửi làm tham khảo hình khối và `B-bright-handheld.png` làm tham khảo style. Asset ở thư mục này chỉ là nguồn duyệt mockup; asset production chỉ được đăng ký vào `assets/manifest.json` sau khi người dùng chọn phương án.

Render lại bằng:

```bash
node ai-workflow/mockups/map-direction-signs/render.mjs
```
