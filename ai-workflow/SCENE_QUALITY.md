# Chuẩn scene web — Bright Handheld

Yêu cầu ngày 2026-10-04; người dùng chọn bố cục E ngày 2026-10-05 tại `mockups/scene-01-scale-v2/E.png`. Đây là tiêu chí nghiệm thu. Tình trạng triển khai và kết quả thật được lưu trong `reports/scene-01-e-2026-10-05.md`, không suy ra đã đạt chỉ từ tài liệu này.

## Va chạm và di chuyển

- Mỗi map có dữ liệu vùng đi được, vật cản và cổng cùng hệ tọa độ artwork. Nhà, gốc cây, đá, hàng rào, giếng và nước chặn đường; cầu đi được. Không suy va chạm từ màu ảnh tại runtime.
- Hitbox ở chân nhân vật; mái/tán cây thuộc lớp che khi thích hợp. Tìm đường quanh vật cản, cấm cắt chéo góc kín; kiểm tra từng đoạn di chuyển để không xuyên vật thể khi frame chậm.
- Suối liên tục dưới cầu. Polygon đi được đo từ mặt cầu và dùng cùng transform với atlas; không mở cả dải đất ngang suối. Mặt cầu vẽ dưới chân, tránh che mất người đang qua. NPC, tài nguyên và quái có body trong navigation.
- Bấm vật cản: tìm điểm tiếp cận hợp lệ hoặc báo không tới được. NPC/tài nguyên chỉ tương tác khi đã tới gần, mỗi hành động ghi nhận một lần.
- Chỉ chuyển map tại cổng trái/rừng, phải/núi, trên/vùng khác. Spawn và ba NPC chính phải kết nối bằng đường hợp lệ. Không chuyển map ở mọi điểm trên mép màn hình.
- Test vòng quanh từng nhà, giếng, nước, hàng rào; góc chéo; đích không tới được; đổi đích liên tục; frame chậm; đi/về ba cổng. Có lớp debug collider/path tắt mặc định.

## Độ nét và tỉ lệ

- Tách world, camera, CSS viewport và canvas backing store. ResizeObserver theo viewport, backing store theo devicePixelRatio có giới hạn cấu hình. Chuột dùng phép nghịch đảo của transform vẽ gồm offset/letterbox.
- Không kéo canvas 1200×720 phủ màn hình bằng object-fit: cover. Không bóp méo tỉ lệ. Pixel art dùng nearest-neighbor; HUD là DOM với font đủ dấu tiếng Việt.
- Nguồn đủ chi tiết tại kích thước hiển thị thật; upscale ảnh cũ không tạo chi tiết mới. Tách nền/vật thể/foreground/hiệu ứng và dữ liệu map; ưu tiên tile và sprite tái sử dụng.
- Mốc đề xuất tại 1920×1080: nhân vật 36–44 CSS px, nhà rộng 140–200 px, đường chính 120–160 px, đất/cỏ trống 60–70%. Chỉ khóa số sau khi duyệt mockup. Resize không tự phóng nhân vật theo chiều cao màn hình.
- Kiểm tra 1280×720, 1920×1080, 2560×1440, DPR 1/2, panel 720×900: click đúng chỗ, HUD không chắn lối, chữ/sprite sắc. Panel hẹp dùng camera thích ứng.
- Kiểm tra resize ngay khi đang chơi và nhấp lại sau resize. Kiểm tra giảm chuyển động bằng một vùng hiệu ứng cụ thể, không chỉ chứng minh hai ảnh toàn màn hình khác nhau.

## Bản địa hóa

- Mặc định tiếng Việt; mọi menu, nhãn NPC/map, nhiệm vụ, lời thoại, thông báo, tooltip và accessibility dùng khóa locale. Không viết câu trực tiếp trong component/canvas.
- Danh mục dự kiến `game/src/locales/vi.json`, `en.json`; API dịch có key được kiểm tra, nội suy tên/số, fallback tiếng Việt. Tên người chơi là dữ liệu, không dịch.
- Cùng khóa và biến nội suy giữa các ngôn ngữ; dùng Intl cho số; không ghép mảnh câu theo trật tự tiếng Việt. Test thiếu key, key lộ ra UI, text dài bị tràn; canvas đổi ngôn ngữ cùng HUD.
- Dùng icon nguyên bản hoặc nhãn Việt, không dùng Hán tự/Kana/Hangul làm icon. Artwork không chứa chữ; biển hiệu dùng lớp chữ bản địa hóa.

## Chuyển động môi trường

- Hiệu ứng gắn đúng vị trí: sóng/thác nước, khói/tàn lửa lò rèn, lá/cỏ lay, bướm/bụi nhẹ. Nhân vật có hướng/bước chân; NPC phụ đi trong vùng hợp lệ.
- Hiệu ứng tách nền; emitter có giới hạn hạt, lifetime, cleanup khi đổi scene, dt theo thời gian. Dừng khi tab ẩn, tôn trọng prefers-reduced-motion và tùy chọn giảm hiệu ứng.
- Đo FPS/frame time trong production khi bật hiệu ứng và chuyển map nhiều lần. Mục tiêu desktop 60 FPS; ghi máy/viewport/kết quả, không suy từ build thành công.

## Thư viện asset

- Gốc `assets/`; tra `assets/manifest.json` trước khi gen. Tái sử dụng hoặc chỉnh bản có sẵn trước.
- Manifest: ID, loại, phiên bản, nguồn/bản runtime, kích thước thật, alpha, hash, nguồn gốc, prompt nếu có, trạng thái QA và scene sử dụng. Cutout tạm phải đánh dấu cần kiểm tra.
- Nhóm characters, npcs, scenes, references, effects, audio, archive. Hiệu ứng bằng mã lưu công thức/cấu hình và liên kết runtime. Thư mục audio chưa có file phải ghi chưa có, không coi đã làm nhạc.
- Sprite có alpha thật, không viền nền/rác, pivot tại chân, scale/palette/hướng/frame timing nhất quán. Giữ nguồn/phiên bản. Gen/chỉnh raster qua ImageGen với B làm reference; lưu prompt chính xác và file trong project.
- Metadata gốc của frame/atlas thuộc `assets/production/`; bản dùng trong engine được kiểm tra hash. Đổi hash phải tăng phiên bản và về `needs-review`. Công cụ đăng ký không tự công nhận đã review; cờ `--reviewed=<ID,...>` chỉ dùng sau khi xem các asset đó trong bản chạy.

## Gate

`node tools/check-game-quality.mjs --assets-only` kiểm tra thư viện; bỏ cờ để kiểm tra ký tự, JSX/nhãn trợ năng chưa qua locale, cặp vi/en và frame atlas. Từ `game/`, `npm run verify` chạy thêm test đường đi/va chạm/tương tác/cổng/camera, build và Playwright production. Báo cáo/ảnh ở `game/test-results/`. Kiểm tra source rectangles và xem ảnh thật sau mỗi thay atlas. Chỉ báo xong khi phương án duyệt đã tích hợp, build và các kiểm tra liên quan đạt.
