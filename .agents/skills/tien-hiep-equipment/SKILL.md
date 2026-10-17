---
name: tien-hiep-equipment
description: Thêm hoặc sửa túi đồ, trang bị, catalog vật phẩm, chỉ số cộng và ngoại hình theo đồ trong Game Tiên Hiệp. Không dùng cho thuộc tính quái hay bố cục HUD không liên quan vật phẩm.
---

# Trang bị và túi đồ

Đọc `ai-workflow/EQUIPMENT.md` để phân biệt yêu cầu, đề xuất và trạng thái triển khai; đọc `ai-workflow/harness/equipment-cases.json` khi xây/test. Runtime catalog ở `game/src/items/catalog.ts`; bản preview chỉ là lịch sử thiết kế.

- A đã được chọn ngày 2026-10-13 tại `ai-workflow/mockups/equipment-inventory/A.png`; tiếp tục A, không hỏi chọn lại cho sửa lỗi cùng tính năng. UI mới khác phạm vi theo FEATURE_WORKFLOW.
- Sửa ngày 2026-10-13: chỉ một điểm vào ngoài map **Hành trang / Equipment**; bảng compact vừa viewport, màn hẹp có tab nội bộ. Không khôi phục hai nút mở cùng dialog. Kiểm tra chiều cao thực tế, không chỉ tràn ngang.
- Khi thêm/sửa hình vật phẩm, đọc `ai-workflow/ITEM_ART.md` và `ai-workflow/harness/item-art-cases.json`. Item mới cần hình vật thể có khối/chất liệu thuộc Bright Handheld, không chỉ glyph nét viền hoặc khung. Bộ **B — Thanh Trúc** tại `mockups/item-art-directions/B.png` đã chọn; không hỏi lại. Production là PNG alpha riêng trong `assets/production/items/`, catalog dùng `iconAssetId`, resolver ở `art.ts`; không dùng board review làm atlas. Icon túi và attachment trên nhân vật là hai asset khác nhau.
- Túi 100 ô bên phải thuộc tính, 10 slot, item cấp 1–9 và bonus khi đeo. Nguồn quy tắc stacking/save/starter set tại EQUIPMENT, không tự cấp mọi món mới thêm vào catalog.
- Định nghĩa item tập trung, ID ổn định; save sở hữu tách catalog. Món chỉ dùng cơ chế/hình sẵn nên thêm entry; hình/cơ chế mới cần asset/executor, không hứa catalog tự sinh mọi thứ.
- Equip/swap/unequip bảo toàn instance và số lượng; túi đầy không xóa đồ. Derived stats lấy base cộng đồ đang đeo một lần, giữ công thức `game/src/combat/stats.ts`; snapshot vào trận. Không tự gán hệ tu luyện hoặc thêm hiệu ứng phần trăm/skill đồ.
- Migration giữ resource/visited/lượt cũ và không lặp. Save lỗi không ghi đè bản gốc bằng dữ liệu rỗng. Đừng coi localStorage là đồng bộ hoặc bảo đảm không mất dữ liệu.
- Ngoại hình đổi đồ là tùy chọn theo yêu cầu. Sprite hiện có baked trang phục; cần base sạch và layer tương thích hướng/pose trước khi hứa chân trần/kiếm thật. Tra manifest và ART_BIBLE; giữ Bright Handheld, collider không đổi theo trang phục. Khi sửa renderer, dùng scene-quality; khi nối combat, dùng combat-flow.
- Test tại `game/test/equipment.test.mjs` và `game/test/browser/equipment.spec.ts`: equip → thuộc tính → sát thương hai chiều → về map → reload, đầy túi/migration, vi/en, input/camera và hình từng hero nếu có. Harness kế hoạch không phải test pass; báo bằng chứng và giới hạn thực tế. Save `truc-khe.inventory.v1` dưới Web Locks; giữ dữ liệu legacy và phần dư migration, không re-seed starter sau reload.

Khi thêm món sau này, cập nhật catalog/locale/iconAssetId/visual reference và test tương ứng; không chép số cân bằng vào nhiều skill. Chỉ cập nhật CONTEXT khi người dùng yêu cầu.
