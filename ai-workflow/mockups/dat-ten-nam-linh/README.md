# Chọn nhân vật, đặt tên và vào làng Nam Lĩnh

**Trạng thái:** bốn mẫu nhân vật cho người chơi lựa chọn và năm bố cục mockup. Chưa triển khai game.

## Yêu cầu hiện tại

- Người chơi chọn **một trong bốn** mẫu nhân vật A–D và đặt tên. Mẫu và tên được dùng cho nhân vật chính trong game.
- Người chơi **không chọn vùng xuất phát**. Sau khi xác nhận, nhân vật tự xuất hiện ở một làng tân thủ thuộc **Nam Lĩnh**.
- Khi triển khai gameplay, bốn mẫu cần được chuyển thành sprite **chibi** để nhân vật đi tới điểm nhấp chuột.
- Tên riêng của làng chưa được quyết định; preview chỉ gọi là “làng tân thủ Nam Lĩnh”.

## Bốn hình mẫu

| Mẫu | Giới tính | Nhận diện | File |
| --- | --- | --- | --- |
| A · Thanh y | Nữ | Áo xanh ngọc, điềm tĩnh | `public/characters/A-thanh-y.png` |
| B · Lam y | Nam | Áo lam, kiên định | `public/characters/B-lam-y.png` |
| C · Vân y | Nữ | Áo màu đất, tự tin | `public/characters/C-van-y.png` |
| D · Mặc y | Nam | Áo nâu mực, trầm ổn | `public/characters/D-mac-y.png` |

Ảnh là **concept art toàn thân** để chọn thiết kế. Nhân vật được chọn cần được chuyển thành sprite và animation khi triển khai game; chưa coi bốn ảnh này là sprite hoàn chỉnh. Ảnh được tạo bằng built-in ImageGen, nền trong suốt, theo prompt chung: nhân vật tu tiên trẻ tuổi, toàn thân, tư thế trung tính, trang phục tân tu, nét vẽ 2D và không gắn vũ khí hay hệ chiến đấu. Prompt từng mẫu thay đổi giới tính, tóc, bảng màu và dáng vẻ như bảng trên.

### Prompt đã dùng với built-in ImageGen

Prompt chung được nối sau mỗi mô tả mẫu:

> Use case: stylized-concept. Asset type: candidate protagonist concept for a 2D web xianxia game. One young adult East Asian fantasy cultivator, full-body standing front-facing in a relaxed neutral pose, entire figure visible head to toe, centered, clean readable silhouette. Consistent hand-painted 2D animation model-sheet style, refined ink outlines, restrained cel shading, subtle fabric texture, polished professional game concept art. Transparent background with no floor, scenery, props, labels, text, watermark, UI or extra characters. Clothing should read as a novice traveler and remain compatible with future magic, sword, or martial combat paths; no weapon.

- **A:** Candidate A: female protagonist, calm and determined, long dark hair half tied with a small jade clasp; layered sage-green and cream traveling robes with a short practical cape, simple boots, slim athletic silhouette.
- **B:** Candidate B: male protagonist, curious and resilient, dark hair in a high loose ponytail; layered indigo and pale blue traveling robes with practical sleeves and leather belt, simple boots, lean athletic silhouette.
- **C:** Candidate C: female protagonist, lively and confident, dark chestnut hair in a low braided ponytail with small copper ornament; layered muted terracotta and ivory traveling robes with a light scarf, simple boots, compact athletic silhouette.
- **D:** Candidate D: male protagonist, steady and warm, shoulder-length dark hair partly tied, no beard; layered charcoal, warm brown and sand-colored traveling robes with sturdy cloth bracers, simple boots, broad athletic silhouette.

## Năm bố cục UI

| Bố cục | Ý chính |
| --- | --- |
| A · Sổ nhập môn | Form đặt tên cạnh chân dung lớn. |
| B · Cổng Nam Lĩnh | Chân dung trong cảnh làng, form ở mép dưới. |
| C · Mệnh bài | Tên như được khắc vào tấm thẻ thân phận. |
| D · Đối thoại trưởng làng | Người chơi đặt tên qua đoạn thoại mở đầu. |
| E · Bình minh Nam Lĩnh | Form gọn trên toàn cảnh làng. |

Các thẻ chọn **mẫu A–D** là một phần của luồng tạo nhân vật mà người chơi sẽ thấy. Năm tab bố cục A–E chỉ phục vụ so sánh preview, không phải lựa chọn trong game. Trong khung cảnh đặt tên không có lựa chọn vùng. Sau khi nhập tên, preview mô phỏng trạng thái vào làng; để trống tên sẽ có thông báo lỗi.

## Chạy preview

```bash
cd "ai-workflow/mockups/dat-ten-nam-linh"
npm install
npm run dev -- --port 4173
```

Mở `http://localhost:4173/?variant=A&hero=A`. Có thể đổi `variant` từ A đến E và `hero` từ A đến D, hoặc dùng nút trên trang. Build: `npm run build`.

Nguồn React/TypeScript/CSS nằm trong `src/`. Vùng làng vẽ bằng canvas chỉ để minh họa; chưa có Phaser, lưu tiến trình, gameplay hoặc map tương tác. Cốt truyện và lối sang rừng/núi nằm tại [`../../../scenes/`](../../../scenes/). Bảng màu thủy mặc, ngọc và ánh kim vẫn là đề xuất chưa được duyệt trong `DESIGN_SYSTEM.md`.
