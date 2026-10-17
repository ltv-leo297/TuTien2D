# Thư viện asset dùng lại

Tra `manifest.json` theo ID trước khi tạo mới. Bản nguồn ở đây; bản runtime hiện tại ở `game/public/`. Hai bản được kiểm tra hash bởi `node tools/check-game-quality.mjs --assets-only`.

- `references/`: bộ B đã chọn.
- `characters/`, `npcs/`, `scenes/`: asset hiện có, giữ nguyên byte khi nhập thư viện.
- `archive/characters/`: các concept/cutout cũ, không tự chọn lại thay B.
- `effects/`: chỗ lưu spritesheet hoặc cấu hình hiệu ứng tái sử dụng.
- `audio/`: nhạc, ambience và âm thanh khi được tạo/cấp phép.

`production/` chứa bốn spritesheet nhân vật (12 frame/bộ), NPC (9 frame), atlas 12 vật thể và bốn chất liệu mặt đất. Các cutout concept cũ vẫn được giữ, đã ngừng dùng trong runtime. Cấu hình frame đọc tại `game/src/engine/sprite-frames.json` và `atlas.json`; ảnh gốc không bị cắt sửa mất dữ liệu. `audio/` có ambience tổng hợp nguyên bản; `effects/ambient-v1.json` là preset mà renderer nhập trực tiếp. Nguồn/prompt có trong `production-prompts.json`, `npc-production-prompt.json`, `terrain-production-prompt.json`.

Đăng ký asset production bằng `node tools/register-production-assets.mjs`, rồi `node tools/check-game-quality.mjs`. Tổng cộng 29 mục, gồm bản tham chiếu, archive và metadata. `production/atlas.json` và `production/sprite-frames.json` là metadata nguồn; bản runtime ở `game/src/engine/` được kiểm tra cùng hash. `tools/inspect-atlas.py` chỉ đọc alpha để ghi source rectangles vào cả hai nơi, không thay đổi pixel ảnh.

File mới hoặc thay hash sẽ tăng phiên bản và về `needs-review`. Sau khi xem asset ở scale gameplay, chạy `node tools/register-production-assets.mjs --reviewed=<ID,...>` chỉ cho các ID đã kiểm tra. Lệnh đăng ký thông thường không tự đánh dấu đã duyệt. Thay scale/camera vẫn cần kiểm tra hình ảnh lại dù hash ảnh không đổi.

Asset mới cần ID, phiên bản, nguồn/prompt chính xác nếu có, hash/kích thước/alpha, pivot/frame/hướng khi có animation, trạng thái duyệt và scene sử dụng. Thông tin chưa biết ghi null hoặc trạng thái chưa xác minh. Khi thay bản runtime, cập nhật bản thư viện và manifest cùng lúc rồi chạy harness.
