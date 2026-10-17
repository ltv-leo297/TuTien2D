# Combat B — bàn giao ngày 2026-10-11

## Phạm vi đã hoàn tất

Người dùng chọn **B — Sân đấu thoáng**, sửa ưu tiên: chỉ hiện số lượt còn đánh được khi bấm quái ngoài map. Không có số lượt trong trận/kết quả; không countdown, mốc hồi hoặc giải thích hồi lượt cho người chơi. Các khung flow trong ảnh mockup cũ không phải thành phần màn đấu.

Đã nối flow thật: tạo nhân vật → cổng làng → Rừng Thanh Trúc → tiếp cận Mộc Yêu non/Bào Tử Yêu → thẻ lượt → tải → combat ngang → kết quả → về vị trí trước trận. Giữ túi và tiến trình khám phá. Không tự mở trận lại sau khi quay về.

- Mỗi quái tối đa 10 lượt; trừ đúng một lượt khi asset tải xong và save thành công. Mỗi lượt hồi độc lập 300.000 ms sau khi kết thúc trận, chạy ngầm theo timestamp.
- Reload giữa trận xử lý rút lui một lần ở lần mở tiếp theo. Web Lock giữ phiên để tab khác không trừ lượt hoặc kết thúc hộ trận đang mở. Save lỗi hiển thị thông báo, không xoá túi/tiến trình.
- Combat thời gian thực: di chuyển, nhảy đôi, đánh thường, giữ đỡ theo hướng, lướt né, kỹ năng tốn linh lực/cooldown, quái báo chiêu trước đạn và đòn mặt đất. Có nút màn hình và bàn phím, tạm dừng, xác nhận rút lui, thắng/thua.
- Bố cục B gọn: HUD hai góc, nút điều khiển dưới; sân đấu riêng, không mang các panel khám phá hoặc flow mẫu vào trận.

## Mã và tài liệu

Runtime: `game/src/combat/{charges,simulation,renderer}.ts`, `Combat.tsx`, `combat.css`, `frames.json`; tích hợp trong `game/src/App.tsx`, locale vi/en. Luật hồi lượt tách đồng hồ combat; simulation bước cố định; HUD không cập nhật mỗi frame; rời trận dọn input/listener/RAF.

Asset mới: nền trống `combat-arena.png`, atlas có alpha `combat-actors.png` (4 nhân vật + 2 quái), metadata `combat-frames.json`. Bản nguồn ở `assets/production/`, bản runtime ở `game/public/assets/production/`; prompt/reference ở `assets/combat-production-prompts.json`. Đã xem ảnh nguồn và runtime, đo crop/pivot theo alpha thay vì chia đều atlas. Manifest 35 asset, không còn mục chờ review tại lần kiểm tra này.

Quy tắc tái sử dụng được ghi trong `COMBAT_FLOW.md`, `CONTEXT.md`, `DESIGN_SYSTEM.md`, `ART_BIBLE.md`, `AGENTS.md`, skill `tien-hiep-combat-flow`, hướng dẫn mockup và `harness/combat-cases.json`. B đã duyệt; không yêu cầu chọn lại để tiếp tục cùng phạm vi. Harness phân biệt phần pass với phần chưa được kiểm tra.

Đã kiểm tra JSON harness, đường dẫn tham chiếu và frontmatter cơ bản của skill. Validator `skill-creator/scripts/quick_validate.py` chưa chạy được vì Python hiện thiếu PyYAML; không coi kiểm tra cơ bản là kết quả pass của validator này.

## Kiểm thử thực tế

Môi trường: Node 24, Chrome/Playwright trên máy hiện tại; production Vite preview cổng 4181. Game dev cổng 4174.

1. `npm --prefix game run verify`: **28 unit pass**, audit **35 asset / 0 chờ review**, locale/metadata pass, build pass, **21 browser test pass** (khoảng 2,6 phút).
2. Sau chỉnh nhỏ tránh cập nhật React liên tục ở kết quả trận: từ `game/` chạy `npm run build && npx playwright test test/browser/combat.spec.ts`: **build pass, 10/10 combat browser test pass**, 56 giây. Không thay đổi logic lượt hoặc simulation trong chỉnh cuối này.

Các kiểm tra gồm ranh giới chính xác 5 phút, hai lượt hồi độc lập, 0/10, thời gian offline mô phỏng, reload, idempotence, lỗi tải, lỗi ghi storage, khoá nhiều tab, thắng/về đúng vị trí, rút lui/giữ túi, di chuyển/nhảy/đỡ/né/kỹ năng, collision đạn nhanh, pause, bốn ngoại hình, locale Việt/Anh, resize và DPR. Test browser xác nhận không có lượt/countdown trên HUD/kết quả. Suite đầy đủ giữ các test scene hiện có.

Đo production combat 1920×1080 DPR1, sau warm-up: 320 mẫu frame, p95 **16,7 ms**, xấp xỉ **60 FPS** ở lần full verify. Full-flow không có pageerror. Đây là đo localhost/desktop, không suy ra hiệu năng mạng hoặc điện thoại.

## Ảnh runtime

- `combat-B-runtime-2026-10-11.png`: màn chiến đấu B đang chơi, không có bảng lượt/hồi.
- `combat-count-outside-2026-10-11.png`: thẻ quái ngoài rừng với số lượt.
- `combat-narrow-2026-10-11.png`: viewport 720×900 DPR2, English.
- `combat-browser-results-2026-10-11.json`: kết quả lần chạy combat cuối. `game/test-results/` là thư mục tạm và sẽ bị lần test sau ghi lại.

## Giới hạn rõ ràng

- Đây là bộ thao tác/chỉ số tân thủ chung; chưa tích hợp công thức ba hệ tu luyện, cân bằng cuối, XP hoặc vật phẩm sau trận. Không sửa công thức thiết kế gốc.
- Lưu localStorage và đồng hồ máy, chưa backend/cloud save/chống chỉnh đồng hồ. Trình duyệt cần Web Locks; không dùng fallback trừ lượt thiếu an toàn.
- Arena mặt đất phẳng; chưa có platform nhiều tầng. Atlas là bộ pose cơ bản, chưa phải hệ animation nhiều frame hoàn chỉnh.
- Chưa kiểm tra điện thoại thật/multi-touch, Firefox/Safari, heap leak hoặc mạng di động. Narrow viewport không đồng nghĩa mobile đã nghiệm thu.
- Defeat có unit test, chưa có case browser riêng cho defeat → map; simultaneous fatal hits, OS pointercancel và reduced-effects visual chưa có case chuyên biệt. Xem harness để giữ các khoảng trống này khi mở rộng.
