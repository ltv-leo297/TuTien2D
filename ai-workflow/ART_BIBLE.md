# Art Bible — Bright Handheld Pixel Xianxia

**Trạng thái:** Đã duyệt. Áp dụng cho toàn bộ game kể từ Scene 1.

## 1. Nguồn chuẩn

- Master reference: `ai-workflow/mockups/pixel-art-asset-directions/B-bright-handheld.png`.
- Tên nội bộ: **Bright Handheld**.
- Ảnh do built-in ImageGen tạo từ một ảnh tham khảo pixel RPG do người dùng cung cấp. Ảnh tham khảo chỉ dùng để lấy đặc tính chung; không sao chép nhân vật, quái, kiến trúc, logo, UI hoặc bố cục của game có sẵn.

Mọi lần tạo asset sau phải đính kèm master reference B làm ảnh style reference. Nếu một asset mới lệch khỏi reference, tạo lại trước khi tích hợp.

## 2. Ngôn ngữ hình ảnh cố định

Yêu cầu mới về camera, vật thể nhỏ/đường rộng, tiếng Việt, chuyển động và asset nằm trong `SCENE_QUALITY.md`. Tra `assets/manifest.json` trước khi tạo hình. Bố cục E đã chọn ngày 2026-10-05 tại `mockups/scene-01-scale-v2/`; giữ palette, camera top-down và nhận diện B. Runtime dùng sprite nhân vật cao 44 world px, bản đồ 1920×1080 và đường chính 130 world px. Sprite/atlas production, prompt và ambience được lưu trong `assets/`.

- Góc nhìn: top-down 3/4, camera cố định; mặt trước và mặt bên của công trình đều nhìn thấy.
- Ngoại lệ theo yêu cầu 2026-10-11: màn combat riêng dùng side-view ngang để nhảy/né/đỡ; giữ palette, pixel và nhận diện B. Sprite combat theo góc nhìn này, map khám phá vẫn top-down. Bố cục combat B đã chọn; số lượt chỉ ở ngoài trận và hồi ngầm, xem `COMBAT_FLOW.md`.
- Pixel: cụm pixel cứng, cạnh sắc, không blur, không anti-alias kiểu vector, không render 3D mượt.
- Tỉ lệ: tile cơ sở cảm giác 32 px; nhân vật chibi cao khoảng 1.5–2 tile; đầu lớn, thân nhỏ, silhouette đọc được khi thu nhỏ.
- Màu: cỏ xanh non và xanh bạc hà; mái ngói đỏ son/đỏ cam; nước cyan; đá xám xanh; gỗ nâu ấm; áo nhân vật dùng xanh lam, xanh ngọc, đỏ san hô, tím nhạt.
- Độ tương phản: viền tối vừa phải quanh nhân vật, NPC, quái và vật thể tương tác; nền ít tương phản hơn foreground.
- Ánh sáng: ban ngày trong, bóng đổ ngắn và mềm nhưng vẫn tạo bằng cụm pixel.
- Kiến trúc: nhà gỗ nhỏ, mái ngói cong đỏ, đèn lồng và hàng rào tre; tiên hiệp nguyên bản, không logo hay ký hiệu của franchise khác.
- Thiên nhiên Nam Lĩnh: trúc, cây lá tròn, hoa nhỏ, thác/nước trong, đá phủ rêu, đường đất màu vàng kem.
- UI: khung pixel màu ngọc/xanh rêu, điểm nhấn vàng ấm; chữ UI luôn là HTML/CSS thật, không nhúng chữ vào ảnh.

## 3. Quy tắc nhân vật và animation

- Bốn nhân vật chính luôn giữ màu nhận diện và kiểu tóc qua mọi sprite, portrait và animation.
- Mỗi nhân vật production cần tối thiểu bốn hướng: xuống, trái, phải, lên; animation đi bộ tối thiểu 3 frame mỗi hướng.
- NPC dùng cùng tỉ lệ với nhân vật chính. Nghề nghiệp đọc được bằng đạo cụ: búa/đe cho thợ rèn, giỏ thảo dược cho dược sư, sách/bút cho thầy đồ.
- Quái có hình khối tròn, dễ đọc, hơi đáng yêu ở vùng tân thủ; vùng cao cấp có thể nguy hiểm hơn nhưng vẫn cùng cụm pixel và tỉ lệ.

## 4. Prompt gốc để tái tạo style

```text
Use case: stylized-concept
Asset type: original top-down 2D web RPG game asset
Style reference: use B-bright-handheld.png only for color language, pixel density, chibi proportions, outline treatment and top-down 3/4 camera.
Primary request: create an ORIGINAL Vietnamese-inspired xianxia fantasy pixel-art asset for the requested scene or subject.
Style/medium: bright handheld-era pixel art, clean 24–32 px pixel language, cheerful saturated colors, readable dark outlines, rounded chibi proportions, lush mint-green Nam Linh palette, vermilion roofs and cyan water.
Constraints: deliberate hard pixel clusters; consistent scale and top-down 3/4 view; reusable game production asset; no anti-aliased vector look; no smooth 3D rendering; no existing franchise character, creature, building, logo, UI or layout; no watermark; no embedded readable text.
```

Mỗi prompt scene mới thêm danh sách đối tượng, bố cục map, trạng thái thời tiết và lối ra cần thiết; không thay phần style và constraints ở trên.

## 5. Kiểm tra consistency trước khi tích hợp

1. So cạnh asset mới với master reference B ở cùng tỉ lệ hiển thị.
2. Kiểm tra camera, kích thước nhân vật, viền, palette, bóng đổ và mật độ chi tiết.
3. Kiểm tra asset đọc được ở kích thước gameplay thật.
4. Loại bỏ chữ, logo hoặc chi tiết giống franchise khác.
5. Chỉ đưa vào game sau khi các điểm trên đạt.

## 6. Cách duyệt ở các scene sau

Xuất vài ảnh phương án trực tiếp trong cuộc trò chuyện để người dùng xem và chọn. Không dựng trang preview hay server riêng cho bước chọn ảnh nếu người dùng không yêu cầu.
