# Context dự án: Game Tiên Hiệp

**Trạng thái:** Đã có context dự án

## Những gì đã xác nhận

- Đây là project game tiên hiệp 2D, với **web là nền tảng chính**. Đã có runtime trong `game/`: React 19, TypeScript, Vite, Canvas 2D; kiểm chứng từ mã nguồn và package.json ngày 2026-10-11. Ba ghi chú thiết kế gốc nằm trong thư mục con `Game Tiên Hiệp/`.
- **Cách chơi dự kiến:** nhận nhiệm vụ từ hệ thống hoặc NPC, tu luyện để lấy kinh nghiệm, farm quái để nhận kinh nghiệm và vật phẩm. Nguồn: `Game Tiên Hiệp/## 2026-10-04 cách chơi`.
- **Bối cảnh dự kiến:** một bản đồ thế giới và nhiều bản đồ nhỏ; các vùng Tây Vực, Bắc Nguyên, Nam Lĩnh, Đông Hải, Trung Châu. Nguồn: `Game Tiên Hiệp/## 2026-10-04 bối cảnh game`.
- **Tu luyện và chiến đấu dự kiến:** ba hệ Luyện khí sĩ, Kiếm tu, Thể tu; mỗi hệ 15 cấp. Tài liệu liệt kê các chỉ số chiến đấu, Ngộ tính/Căn cốt/Tâm cảnh, kỹ năng riêng từng hệ, hệ số kỹ năng 1–10 theo bước 0,5 và công thức sát thương cho từng hệ. Nguồn: `Game Tiên Hiệp/## 2026-10-04 Hệ thống tu luyện và sức mạnh và skill`.
- Các ghi chú trên là **thiết kế**, chưa phải tính năng đã triển khai. Quy trình làm tính năng nằm trong `FEATURE_WORKFLOW.md`; hệ giao diện trong `DESIGN_SYSTEM.md`.
- **Art direction đã chốt:** bộ **B — Bright Handheld**, pixel art top-down màu sáng, nhân vật chibi và vật thể dễ đọc. Bộ chuẩn nằm tại `ai-workflow/mockups/pixel-art-asset-directions/B-bright-handheld.png`; quy tắc tái tạo và giữ nhất quán cho toàn game nằm trong `ai-workflow/ART_BIBLE.md`.
- **Cách duyệt asset:** ở các scene sau, tạo vài ảnh phương án để người dùng xem trực tiếp và chọn; không cần dựng hoặc chạy một trang lựa chọn riêng.
- **Hiện trạng khám phá:** chọn 4 ngoại hình/đặt tên → Làng Trúc Khê; cổng sang Rừng Thanh Trúc, Núi Xích Nham, Đường Thiên Lộ. Có tìm đường/va chạm, NPC, thu thập và túi/tiến trình localStorage. Rừng có `wood-yao` (Mộc Yêu non), `spore-yao` (Bào Tử Yêu); tiếp cận/bấm quái mở thẻ lượt và vào màn combat ngang riêng, kết thúc về vị trí trước trận.
- **Module:** `game/src/engine/{scene,navigation,simulation,camera,renderer}.ts`, HUD `game/src/App.tsx`, locale `game/src/locales/{vi,en}.json`; asset nguồn/metadata trong `assets/`, runtime trong `game/public/assets/`.
- **Lệnh thật:** từ `game/`: `npm run dev -- --port 4174`, `npm run build`, `npm run verify` (unit + asset/locale + build + Playwright production). Node 24+ và Chrome theo harness. Trạng thái từng lần test nằm trong báo cáo; có script không có nghĩa test mới nhất đã pass.
- **UI đã chọn:** scene E, hồ sơ nhân vật panel phải B + avatar A; bảng chỉ đường gỗ A thay vòng sáng. Nguồn chi tiết `DESIGN_SYSTEM.md`.
- **Combat ngày 2026-10-11:** đã triển khai **B — Sân đấu thoáng**, chỉnh sửa ưu tiên: chỉ hiện số lượt còn đánh được ngoài map khi bấm quái; không số lượt ở HUD/kết quả, không countdown hay giải thích hồi lượt cho người chơi. Rule 10 lượt / hồi 5 phút sau trận chạy ngầm. Runtime `game/src/combat/` có di chuyển, nhảy đôi, đánh, đỡ, lướt, kỹ năng, quái báo chiêu, pause và kết quả. Bản đầu áp dụng bể riêng từng quái rừng và hồi độc lập theo diễn giải thiết kế. Kết quả kiểm thử và giới hạn: `reports/forest-combat-B-2026-10-11.md`. Skill `.agents/skills/tien-hiep-combat-flow/SKILL.md`; nguồn quy tắc `COMBAT_FLOW.md`, harness `harness/combat-cases.json`.

## Cập nhật theo yêu cầu ngày 2026-10-12

- **Quái/combat đã nâng cấp:** catalog `game/src/combat/monsters.ts`, bốn skill/quái và mười stats; damage dùng chung ba công thức gốc ở `stats.ts`; AI chọn chiêu có trọng số theo điều kiện, tài nguyên và cooldown ở `ai.ts`. Snapshot stats khi vào trận. Xem `MONSTERS.md`, báo cáo `reports/monster-ai-2026-10-12.md` (45 unit và bộ combat browser mới nhất 12/12 pass). Chưa có chọn hệ tu luyện, XP hoặc loot quái.
- **Trang bị/túi đồ A đã triển khai ngày 2026-10-13:** người dùng yêu cầu túi khoảng 100 ô bên phải thuộc tính; UI đeo/tháo; item có thông tin, bonus, cấp 1–9 và lưu offline; ngoại hình theo đồ là tùy chọn. Người dùng chọn A `mockups/equipment-inventory/A.png`. Runtime `game/src/items/` có catalog 13 trang bị/6 nguyên liệu, túi 100 ô, 10 slot, bonus/so sánh/tìm/lọc và snapshot stats vào combat. Cân bằng là bản đầu; ngoại hình giữ nguyên vì chưa có layer asset. Quy tắc: `EQUIPMENT.md`; harness `harness/equipment-cases.json`; skill `.agents/skills/tien-hiep-equipment/SKILL.md`. Save `truc-khe.inventory.v1` trong localStorage, Web Locks bảo vệ giao dịch; migration resource cũ bảo toàn phần dư/visited/lượt. Bộ đồ khởi đầu cấp một lần. Báo cáo `reports/equipment-A-2026-10-13.md` ghi kết quả thực tế và giới hạn.

## Yêu cầu thiết kế Rừng Thanh Trúc ngày 2026-10-14

- **Quy ước đã chốt theo yêu cầu người dùng:** linh vật và yêu quái đều có **15 cấp (1–15)**. Đây là quy tắc thiết kế lâu dài; chưa có nghĩa runtime đã triển khai đủ 15 cấp. Không đồng nhất với cấp trang bị 1–9.
- **Rừng Thanh Trúc cần bổ sung:** nhà hoang hơi sụp đổ, thác nước, thêm cây và trúc, đá lớn/đá nhỏ/sỏi và nhiều loại thực vật tu tiên gọi là **linh thảo**.
- **Phân bố yêu cầu:** một loại yêu quái cấp 2 và ba hoặc bốn loại yêu quái cấp 1; vài cây/cụm linh thảo cấp 1 và cấp 2. Chưa chốt tên loài, số cá thể, chỉ số, loot hoặc cơ chế hái/hồi linh thảo. Người dùng chưa quy định toàn hệ linh thảo có 15 cấp.
- **Trạng thái:** đã tạo 5 mockup A–E tại `mockups/thanh-truc-forest-expansion/`, chờ người dùng chọn trước khi sửa runtime. Bản mockup đề xuất 3 loại cấp 1 + 1 loại cấp 2; tên loài/cấp và linh thảo đề xuất nằm trong README của bộ ảnh, chưa phải catalog đã duyệt. Giữ art B, góc nhìn khám phá top-down và HUD/flow combat đã duyệt.

## Còn thiếu (hiện tại)

- Kích thước màn hình, cách điều khiển và mức hỗ trợ mobile web.
- Cân bằng chiến đấu/phần thưởng, chọn hệ tu luyện và hỗ trợ điện thoại thật. Lựa chọn UI combat B đã có, không yêu cầu chọn lại.
- Hệ tu luyện trong ghi chú chưa được triển khai đầy đủ. Combat dùng bộ thao tác/chỉ số tân thủ chung; ba công thức sát thương đã nối, nhưng chưa có chọn hệ hoặc thưởng XP/vật phẩm. Trang bị A đã nối UI/save/combat; đổi ngoại hình theo đồ và kinh tế vật phẩm chưa có.

Chỉ cập nhật context này khi người dùng yêu cầu. Luôn kiểm tra file liên quan đến tác vụ hiện tại vì các ghi chú có thể thay đổi.
