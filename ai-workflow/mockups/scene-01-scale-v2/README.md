# Scene 1 — vật thể nhỏ, đường rộng

Trạng thái: người dùng chọn **E** ngày 2026-10-05 và yêu cầu làm đủ bảy mục. Cùng bộ B Bright Handheld và HUD Việt nhỏ gọn. Mockup tĩnh không chứng minh va chạm/animation đã hoạt động; xem báo cáo runtime tại `../../reports/scene-01-e-2026-10-05.md`.

| Ảnh | Bố cục | Đánh đổi |
|---|---|---|
| A | Quảng trường rộng | Dễ tìm NPC và lối ra; thiên về sân làng |
| B | Làng ven suối | Nước sinh động; cầu là nút thắt |
| C | Phố làng chữ T | Đường rộng, dễ đi; bố cục quy củ |
| D | Đường vòng sân giếng | Đi vòng tự nhiên; quãng đường dài hơn |
| E | Xóm vườn thưa | Nhiều thiên nhiên; NPC xa nhau hơn |

Đề xuất E nếu ưu tiên thoáng và ít nhà; A nếu ưu tiên sân làng trung tâm. Prompt chính xác lưu tại `prompts.json`, tạo bằng built-in ImageGen. Không chạy server duyệt ảnh. Sau khi chọn: map nhiều lớp/collider; camera/DPR/chuột; tìm đường/tương tác; vi/en locale; hiệu ứng; kiểm thử theo `../../SCENE_QUALITY.md`. Không dùng ảnh mockup có HUD/nhân vật nhúng làm nền production. Kích thước chữ/sprite trong ảnh AI chỉ là minh họa; scale runtime cần đo theo viewport đích.
