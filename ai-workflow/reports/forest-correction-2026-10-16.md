# Rừng Thanh Trúc — sửa theo hình 1 người dùng gửi

**Lưu ý:** Đây là báo cáo lịch sử; kết luận hoàn tất hình ảnh/chuyển động đã bị phản hồi của người dùng bác bỏ. Bản thay thế và bằng chứng mới: [forest-rebuild-2026-10-17.md](forest-rebuild-2026-10-17.md).

Ngày 2026-10-16. Lượt triển khai trước diễn giải sai ảnh E thành bố cục bậc đá. Người dùng đã chỉ rõ hình 1; tham chiếu chính thức là `assets/references/forest-selected-2026-10-16.png`. Báo cáo này thay thế kết luận phù hợp hình ảnh trong báo cáo 2026-10-15; các kết quả kiểm thử lịch sử không chứng minh bố cục cũ đúng lựa chọn.

## Thay đổi

- Nhà hoang chuyển về góc trên trái; thác và suối giữa map, cầu gỗ nối hai bờ; thú đá trên bãi khô dưới trái, rắn trên nhánh đông bắc. Đường phía đông uốn vòng giữa rừng dày theo ảnh.
- Chỉnh chính ảnh tham chiếu bằng ImageGen để tạo nền tĩnh, bỏ nhân vật/quái/cây thu hoạch/nhà/cầu/biển khỏi nền. Nhà và cầu là sprite alpha riêng; outline mask trong metadata loại phần halo bên ngoài khi vẽ. Quái, linh thảo, hero và biển chỉ đường vẫn là đối tượng runtime.
- Navigation kiểm tra chính xác các giao điểm với biên polygon cho cả footprint bàn chân. Lỗi khe lõm nằm giữa hai mẫu cách 4 px (gây kẹt ở mép cầu với frame time biến thiên) đã được sửa, có regression test.
- Polygon đi được đo theo canvas tham chiếu 1672×941, cùng transform với nền world 1920×1080; footprint nhà, đá, thân cây, hàng rào và gỗ mục chặn đường. Sông chặn trừ mặt cầu đã đo. Actor có body, hái/đánh phải tiếp cận bằng đường hợp lệ.
- Tán che và lan can trước cầu có lớp vẽ riêng; chân người qua cầu nằm trên mặt cầu. Nước/thác có chuyển động nhẹ, tôn trọng giảm chuyển động.
- Giữ HUD hiện hành, locale Việt/Anh, save vật phẩm và luật lượt combat B. Không đổi chỉ số quái hoặc cân bằng.

## Nguồn

- Prompt chính xác: `assets/prompts/forest-correction-2026-10-16.json`.
- Nền: `assets/production/forest/landscape-v2.png`.
- Nhà/cầu + rect/mask: `assets/production/forest/structures-v2.{png,json}`.
- Dữ liệu map: `game/src/engine/forest.ts`; renderer chung và navigation dùng polygon của scene.
- Đăng ký: `tools/register-forest-correction.mjs`; kiểm tra hash nguồn/runtime, alpha, rectangle và outline mask.

## Kiểm thử

- `npm --prefix game test`: **71/71 đạt**, gồm route/va chạm, đi qua cầu và kiểm tra thu thập hai bờ ở dt 16/17/24/33/100 ms.
- `npm --prefix game run check:assets`: **65 asset, 0 cần review, đạt**; đã kiểm tra nguồn/runtime/hash/alpha/rect/mask/locale.
- `npm --prefix game run build`: **đạt**.
- Lần browser đầu phát hiện 2 fixture spawn cũ và 2 ca kẹt polygon ở mép cầu. Đã sửa fixture và navigation; chạy lại toàn bộ trên production build mới: **45/45 browser tests đạt** bằng `npm run test:browser -- --workers=2` (2,9 phút). JSON: `forest-corrected-browser-results.json`.
- Đã xem trực tiếp ảnh runtime `forest-corrected-final.png`, `forest-corrected-bridge.png` và đối chiếu nhà, thác, cầu, bãi thú đá, đường và độ dày rừng với ảnh người dùng. Nhận xét hình ảnh dựa vào ảnh thực, không suy từ unit tests.

- Chrome production: hái sáu cụm mới, cooldown, save/reload, túi đồ; rắn/thú đá vào trận → rút lui → đúng vị trí và lượt; bridge crossing; VI/EN; click/resize ở 1280×720, 1920×1080 DPR2, 2560×1440, 720×900 DPR2; pixel vùng thác thay đổi khi bật chuyển động và đứng yên khi giảm chuyển động.
- Đã xem ảnh 1280×720 và panel 720×900 DPR2: camera theo người, HUD nằm trong viewport; panel hẹp cắt vùng nhìn theo camera, không bóp méo toàn map.
- Bản dev tiếp tục chạy tại `http://localhost:4174/` (HTTP 200); bản build kiểm thử tại 4181.

## Hiệu năng đo riêng sau khi suite kết thúc

`node tools/measure-forest.mjs`: Chrome headless, production, bật hiệu ứng; mỗi viewport warmup 4 giây rồi lấy mẫu 4 giây, không chụp ảnh/resize trong mẫu. Máy Apple M1 Max, macOS arm64. Cả bốn cấu hình trên đạt khoảng **60,00 FPS**, p95 **16,8 ms**, 240–241 mẫu/cấu hình. Đây là số đo trên máy phát triển, không đại diện mọi thiết bị.

Mở browser context mới tại localhost đến khi tự bấm vào game, asset sẵn sàng và vẽ ít nhất hai frame: **662 ms** ở 1920×1080; không giới hạn mạng. Không coi đây là tốc độ tải qua Internet. JSON đầy đủ: `forest-corrected-performance.json`.

Bản triển khai đã hoàn tất kiểm tra. Ảnh bàn giao: `forest-corrected-final.png` chụp từ production build và `forest-corrected-bridge.png` chụp khi người đứng trên cầu.
