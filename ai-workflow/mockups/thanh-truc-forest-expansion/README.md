# Rừng Thanh Trúc — 5 phương án mở rộng

**Đối chiếu 2026-10-16:** người dùng gửi lại hình E; nguồn đúng là `../../../assets/references/forest-selected-2026-10-16.png` (nhà trái, cầu gỗ giữa, thác giữa). Tên E/thung lũng bậc đá dưới đây là diễn giải cũ đã bị thay thế. Xem `../../reports/forest-correction-2026-10-16.md`.

Ngày thiết kế 2026-10-14. **Người dùng chọn E và yêu cầu triển khai ngày 2026-10-15.** Xem `../../reports/forest-E-2026-10-15.md` để biết trạng thái kiểm thử. Các đoạn đề xuất dưới đây giữ lại như lịch sử thiết kế.

Đã xem trực tiếp runtime ở localhost:4174 và lưu `current-runtime.png`; xác nhận scene qua `game/src/engine/scene.ts`: đường ngang, cây/trúc lặp, không có nước, hai loại quái hiện hữu và ba resource. Đây là khảo sát hình ảnh, không phải lần chạy harness nghiệm thu.

## Yêu cầu đã chốt

- Art B Bright Handheld, khám phá top-down; nhà hoang hơi sụp, thác, nhiều cây/trúc, đá và sỏi, linh thảo cấp 1–2.
- Một loại quái cấp 2, ba hoặc bốn loại quái cấp 1.
- Linh vật và yêu quái đều có 15 cấp, đã lưu `../../CONTEXT.md`. Chưa có yêu cầu giới hạn toàn hệ linh thảo ở 15 cấp.
- Giữ HUD hiện tại: hồ sơ trên trái, minimap và tên map dưới trái, một nút Hành trang dưới phải; cổng bảng gỗ ở cạnh đông về Làng Trúc Khê. Giữ combat B; lượt chỉ hiện khi bấm quái ngoài map, không countdown.

## Đề xuất chung để so bố cục

Tên và phân cấp dưới đây là đề xuất, chưa duyệt catalog, AI, loot hoặc chỉ số:

| Loài | Cấp | Hình dáng/vùng sống |
|---|---|---|
| Mộc Yêu non | 1 | Gốc cây có chồi lá, khoảng rừng gần đường |
| Bào Tử Yêu | 1 | Nấm cam, nền đất ẩm gần gỗ mục |
| Trúc Diệp Xà | 1 | Rắn xanh đốt trúc, bìa bụi trúc |
| Thanh Nham Thú | 2 | Đá rêu, điểm ngọc trên lưng; nhánh sâu gần thác |

| Linh thảo | Cấp | Nhận diện |
|---|---|---|
| Thanh Linh Thảo | 1 | Lá xanh dài, hai cụm nhỏ ven lối |
| Bạch Lộ Hoa | 1 | Hoa trắng đọng sương, hai cụm gần suối |
| Tử Vân Chi | 2 | Nấm linh chi tím nhiều tầng cạnh gỗ mục |
| Ngọc Tủy Thảo | 2 | Lá xanh ngọc, một cụm gần thác |

Sáu cụm linh thảo là số lượng minh họa. Quái trong ảnh thể hiện bốn silhouette, không chốt tổng số cá thể spawn. Không thêm linh vật thuần hóa vào scene khi chưa có yêu cầu cơ chế này.

## Khác biệt A–E

- **A — Vòng rừng bên thác:** đường vòng thoáng; thác tây bắc, nhà hoang đông bắc. Dễ định hướng và farm; ít bí ẩn hơn D.
- **B — Suối chia đôi rừng:** hai bờ, cầu giữa, nhà bên tây. Nước và bãi sỏi nổi bật; cầu là chỗ hẹp cần kiểm tra tìm đường.
- **C — Phế xá giữa rừng:** nhà sụp và sân cũ thành tâm điểm, thác phía đông bắc. Nhận diện riêng rõ; nhà dễ che actor nếu phân lớp sai. Đề xuất ưu tiên sau khi xem ảnh.
- **D — Trúc lâm nhiều ngách:** bốn khoảng trống nối nhau, thác/nhà mở ra ở nhánh phụ. Cảm giác khám phá tốt; cần giới hạn tán trúc che đường.
- **E — Thung lũng bậc đá:** thác nhiều bậc và gờ đá thấp, nhà trên nền cao có bậc đá đi lên. Địa hình đa dạng; collision và phân lớp phức tạp hơn.

## Nguồn và giới hạn

- Ảnh cảnh nền tạo bằng built-in ImageGen; prompt chính xác trong `prompts.json`. Hai reference: ảnh runtime và master `../pixel-art-asset-directions/B-bright-handheld.png`.
- HUD và chữ Việt được ghép bằng HTML/CSS qua trình duyệt, nguồn `render-mockups.mjs`; không chạy trang lựa chọn riêng. Ảnh A–E là ảnh duyệt, không đưa nguyên ảnh/HUD vào asset runtime.
- Chưa chạy build/harness cho tính năng mới vì chưa triển khai. Hiệu ứng thác, lá, linh quang chỉ là ý đồ qua ảnh tĩnh; va chạm, đường đi và thu thập chưa được chứng minh bởi mockup.
- Sau khi chọn: tách asset có alpha và metadata, cập nhật scene/nav/locale/catalog, giữ đường ra không bị quái cấp 2 chặn; thực hiện build, harness và test browser theo workflow. Chỉ ghi phương án đã duyệt vào DESIGN_SYSTEM khi người dùng chọn.

## Lưu ý khi chuyển từ concept sang scene

- Ảnh A/D/E vẽ Thanh Nham Thú đứng giữa các tảng đá vùng nước nông. Khi triển khai phải có bãi đá khô và điểm tiếp cận hợp lệ nối đường; không để người chơi cần đi xuyên nước để tương tác.
- Cụm hoa, sen và nấm trang trí trong ảnh không mặc định đều thu thập được. Sáu cụm linh thảo nêu trên cần ID, hình riêng và nhãn cấp khi chọn.
- Số cá thể quái trong ảnh có thể nhiều hơn số loại; yêu cầu là bốn loại trong bộ đề xuất, không phải bắt buộc bốn cá thể.
