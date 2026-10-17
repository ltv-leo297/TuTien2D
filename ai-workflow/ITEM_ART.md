# Hình vật phẩm có chất liệu

Yêu cầu người dùng ngày 2026-10-13: vật phẩm có hình dạng thật, không chỉ khung/glyph. Áp dụng cho vật phẩm game này, không yêu cầu ảnh chụp hiện thực: giữ pixel art **B Bright Handheld** và ART_BIBLE.

## Trạng thái triển khai 2026-10-14

- Catalog `game/src/items/catalog.ts`: 19 item dùng `iconAssetId` bắt buộc; `art.ts` đổi ID `item.<slug>.b1` thành `/assets/production/items/<slug>-b1.png`, `ItemArt.tsx` hiển thị. 19 PNG alpha riêng đã thay glyph trong túi/đồ đang đeo/chi tiết. Glyph chỉ dành cho ô trang bị trống; ảnh lỗi/ID không còn trong catalog hiển thị ? có nhãn vi/en.
- 5 board A–E trong `mockups/item-art-directions/`, prompt ở `prompts.json`; tạo bằng built-in ImageGen với ảnh master `mockups/pixel-art-asset-directions/B-bright-handheld.png`. Đây là ảnh review, không phải atlas runtime.
- Người dùng chọn **B — Thanh Trúc**, đã triển khai; giữ UI trang bị A và master art B. Đề xuất A Mộc mạc trước đây không được chọn. Prompt production: `assets/prompts/items-thanh-truc-B.json`; toàn bộ hình tạo qua built-in ImageGen, từng món riêng, không cắt từ board.

## Quy chuẩn sản xuất

1. Tra manifest trước khi tạo. Gắn master B và board item được chọn làm reference. Tạo hoặc sửa raster qua skill imagegen/built-in ImageGen; nếu lỗi thì báo, không thay bằng hình lập trình tượng trưng rồi gọi hoàn tất.
2. Mỗi món phải nhận ra từ silhouette và chất liệu: kiếm có lưỡi/chuôi/hộ thủ; áo có cổ, tay, vạt vải; giày có thân và đế; ngọc có khối ngọc/dây; hồ lô có cổ/nút/bầu. Kiếm gỗ phải trông bằng gỗ, không chỉ đổi tên kiếm kim loại.
3. Pixel rõ, viền tối đồng nhất, ánh sáng trên trái, các mảng sáng/tối mô tả thể tích. Trang trí đủ đọc ở kích thước nhỏ, không dùng glow che hình. Không tự chuyển sang ảnh thật/3D.
4. Asset riêng nền alpha thật, không nền caro giả, không khung slot/chữ/level/số lượng hoặc UI nhúng. Gợi ý canvas vuông 128 hoặc 256px, chừa khoảng trống an toàn 10–15%; thông số có thể điều chỉnh theo art đã duyệt. Không cắt nguyên các ô có nền/cỏ/đá trên board review để giả làm icon hoàn chỉnh.
5. Cùng art direction không có nghĩa mọi món dùng một glyph. Tái dùng art chỉ khi thực sự cùng hình (ví dụ cùng vật phẩm khác cấp), ghi rõ chủ ý. Cấp 1–9 vẫn là dữ liệu, không tự suy ra độ hiếm hoặc đổi chỉ số theo hình.

## Tích hợp và thêm món

- Source tại `assets/production/items/`, bản phân phối tại `game/public/assets/production/items/`, đăng ký metadata/ID/prompt/reference và kiểm tra hash theo manifest hiện có.
- `iconAssetId` là field bắt buộc trong catalog; ID khớp manifest và resolver tập trung `art.ts`. Không rải switch theo itemId trong JSX. Tên/mô tả/alt vẫn ở vi/en, số lượng/level là DOM.
- Thêm item có art/cơ chế đã có: entry catalog và test; hình mới: bổ sung asset + metadata. Save không chứa đường dẫn tạm của máy người phát triển.
- Icon túi khác `visualId` attachment trên nhân vật. `visualId:null` hiện tại nghĩa chưa có paper-doll. Không dùng icon lớn dán lên sprite rồi hứa chạy/nhảy/đánh đúng hướng; cần base sạch và layer theo frame nếu người dùng yêu cầu phần đó.
- Asset lỗi phải có fallback rõ ràng và báo QA; glyph legacy không phải bằng chứng art mới đã đạt. Không để thay hình làm đổi bonus/collider/save.

## Nghiệm thu

Ma trận ở `harness/item-art-cases.json` ghi coverage và báo cáo thực chạy; phần chưa chạy không được gọi là pass. Khi thêm món, kiểm tra vi/en, PNG/alpha/bounds/source-runtime hash, thiếu ảnh/404, thumbnails trên nền túi tại viewport thực tế (24–48px), DPR1/2, trạng thái chọn/đeo/tháo. So sánh kiếm gỗ/kiếm tre/kiếm sắt và áo/choàng/giày cạnh nhau. Dùng asset checker + unit/browser của equipment rồi ghi kết quả thực chạy. Nhìn trực tiếp ảnh screenshot; metadata không chứng minh chất lượng hình.

+
+Test thực thi: `game/test/item-art.test.mjs` kiểm catalog → manifest → file/hash/alpha và ID không hợp lệ; `game/test/browser/item-art.spec.ts` kiểm tất cả ảnh tải được, alpha từng pixel/bounds, contact sheet 120/48/24px, đeo/reload, ảnh lỗi và item legacy. Đã nối vào `npm run verify`. Source PNG hiện 1254×1254, giữ nguyên output ImageGen (20,1 MiB dữ liệu PNG cả bộ); chưa có bản phân phối giảm độ phân giải. CSS thu nhỏ bằng bộ lọc trình duyệt để tránh lấy mẫu nearest gây nhiễu ở 24–36px. Không đổi cách vẽ sprite map.

Thêm món: thêm entry catalog có `iconAssetId`, PNG nguồn và prompt đúng item ID trong prompt set. Chạy `node tools/register-item-assets.mjs` từ gốc để copy runtime và đăng ký/hash/version; asset mới hoặc thay ảnh về `needs-review`, không tự duyệt. Sau xem trực tiếp PNG và screenshot runtime, dùng `--reviewed=item.<slug>.b1` với đúng ID đã xem rồi chạy `npm run verify`. Script không cấp món vào túi hay đổi save; không thêm món mới vào STARTER_ITEMS nếu chưa được yêu cầu.
