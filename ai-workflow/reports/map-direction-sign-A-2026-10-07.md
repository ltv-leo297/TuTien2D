# Báo cáo bảng chỉ đường chuyển map A

Ngày: 2026-10-07

## Phương án đã chọn

- A — bảng gỗ liền mũi tên, bản thu nhỏ sau ba vòng chỉnh mockup.
- Thay thế vòng sáng/dấu chấm tại tất cả cổng làng, rừng, núi và Thiên Lộ.
- Bảng nằm sát vùng chuyển map, nhỏ hơn NPC và không che đường vào cổng.
- Tên đích dùng canvas text từ locale Việt/Anh, không nhúng vào asset.

## Phần đã triển khai

- Asset nguồn: `assets/production/signpost-A.png`.
- Runtime: `game/public/assets/production/signpost-A.png`.
- Manifest ID: `production.signpost-A`, trạng thái `runtime-reviewed`.
- Renderer tải bảng cùng nhóm asset production, vẽ trong lớp world theo trục Y và dùng highlight nhẹ khi hover.
- Chân bảng có collider nhỏ; click bảng tìm đường tới tâm cổng thật.
- Debug collider hiển thị cả chân bảng.
- Cập nhật browser test từ vòng sáng sang bảng chỉ đường có text luôn hiện.

## Kiểm thử mới nhất

Lệnh chạy từ `game/`:

```bash
npm run verify
```

Kết quả:

- 18/18 kiểm thử logic đạt, gồm route/collider riêng cho bảng và ba cổng đi/về.
- Asset/locale gate đạt: 32 asset, 0 asset chờ review.
- TypeScript và Vite production build đạt.
- 11/11 kiểm thử Playwright đạt ở 1280×720, 1920×1080 DPR 2, 2560×1440 và 720×900 DPR 2.
- Đã kiểm tra hover bảng, chuyển rừng/núi/Thiên Lộ, resize/DPR, locale Việt/Anh và tương tác NPC.

Ảnh production: `game/test-results/direction-sign-A.png`.
