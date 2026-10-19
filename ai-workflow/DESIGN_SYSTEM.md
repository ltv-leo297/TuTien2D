# Hệ giao diện Game Tiên Hiệp

**Trạng thái:** Đã duyệt art direction B và bố cục Scene 1 E.

Ngày 2026-10-05: người dùng chọn **bố cục E — Xóm vườn thưa** tại `mockups/scene-01-scale-v2/E.png` và yêu cầu triển khai đủ bảy mục. Art style vẫn là B Bright Handheld. Được phép triển khai/kiểm thử E, không hỏi chọn lại cho các sửa lỗi thuộc phạm vi này. Scale gameplay mục tiêu: nhân vật cao 44 world px; world 1920×1080; camera tối thiểu 0.8, DPR tối đa 2; đường 130 world px. Nhà/cây/NPC là lớp riêng có collider và animation.

Game 2D trên web; art direction asset B và bố cục E đã chọn như mục bên dưới. Không coi các đề xuất ngoài phạm vi này là quyết định đã duyệt.

Stack web và cách hiện thực UI nằm trong `TECH_STACK.md`. Định hướng thủy mặc, ngọc thạch, sương và linh quang ở đó chỉ là đề xuất cho bộ mockup đầu, chưa phải style được duyệt.

## Quy tắc cho mockup đầu tiên

- Dùng một ngôn ngữ đồ hoạ tiên hiệp thống nhất trong cả 5 phương án; chỉ thay đổi bố cục và cách tương tác cần so sánh.
- Cho thấy mối nối giữa tính năng mới và phần còn lại của game bằng thành phần điều hướng nhất quán.
- Sau khi người dùng chọn, ghi ở đây các quy tắc được duyệt: màu, chữ, icon, khung/nút, khoảng cách, điều hướng, màn hình tham chiếu và đường dẫn mockup đã chọn.

## Quyết định đã duyệt

### Unity mobile — A Hai ngón cái, chọn ngày 2026-10-18

Người dùng chọn **A** tại `mockups/mobile-ui-2026-10-18/A.png` và yêu cầu triển khai. Phạm vi: UI điện thoại nằm ngang trong project `unity/`, HUD khám phá gọn; combat hai nút hướng trái, cụm nhảy/lướt/giữ đỡ/đánh/linh trảm bên phải; hành trang toàn màn hình có tab Nhân vật/Túi đồ, grid lớn bên trái và chi tiết/Trang bị cố định bên phải. Giữ một điểm vào Hành trang, 100 ô/10 slot, locale vi/en và luật chơi hiện có. UI thích ứng theo vùng an toàn/chiều cao, không chỉ co bố cục desktop 1280×720 xuống điện thoại. Các màn tạo nhân vật, tùy chọn, nhiệm vụ, encounter, pause/kết quả phải có nút dễ chạm và không mất hành động ở màn thấp. Đây là lựa chọn bố cục, chưa phải kết quả kiểm thử Unity/device. Dùng asset/catalog production; số và item minh họa trong ảnh không mở rộng gameplay.

### Trang bị + túi 100 ô — A đã chọn ngày 2026-10-13

Người dùng chọn **A — Ba cột cân bằng** tại `mockups/equipment-inventory/A.png`: thuộc tính trái, avatar/trang bị giữa, túi và chi tiết bên phải. Chỉnh theo yêu cầu 2026-10-13: chỉ một nút **Hành trang / Equipment** mở bảng. 10 slot, 100 ô; so sánh bonus, đeo/thay/tháo, tìm/lọc. Giữ avatar và ba nền tảng tu luyện cũ. Không đưa ba khung mô tả flow dưới mockup vào runtime. Bảng compact vừa viewport; desktop giữ ba cột, ≤680px chuyển tab Nhân vật/Túi trữ vật bên trong. Không ép người chơi cuộn toàn dialog để xem 100 ô. Xem `EQUIPMENT.md`. Ngoại hình theo đồ vẫn chưa triển khai vì cần asset tách lớp; không coi sprite cũ trong ảnh là chức năng này.

### Hình vật phẩm — B Thanh Trúc đã chọn ngày 2026-10-14

Yêu cầu: hình kiếm/áo/giày/ngọc/pháp bảo có hình dáng và chất liệu rõ, không chỉ khung hoặc glyph nét viền. Năm bộ mẫu tại `mockups/item-art-directions/A.png` … `E.png`, cùng art Bright Handheld B: A Mộc mạc, B Thanh Trúc, C Lữ hành, D Tinh xảo, E Linh khí. Đây là mã phương án hình item, không đổi bố cục trang bị A hay art master B. Người dùng chọn **B — Thanh Trúc**; triển khai PNG alpha riêng theo bộ B, không cắt board review có nền làm icon. Quy chuẩn tái sử dụng tại `ITEM_ART.md`.

### Combat Rừng Thanh Trúc — B đã duyệt ngày 2026-10-11

Người dùng chọn **B — Sân đấu thoáng** tại `mockups/forest-combat/B.png`: combat nhìn ngang, HUD gọn, nút di chuyển/đánh/đỡ/skill/nhảy/né. Chỉnh sửa đi kèm có ưu tiên hơn ảnh: chỉ hiện số lượt còn lại ngoài map khi bấm quái; không đưa dải khung flow vào trận, không hiện lượt ở HUD/kết quả, không countdown hoặc thông tin hồi lượt cho người chơi. Rule 10 lượt và 5 phút sau trận chạy ngầm. Kết quả chỉ thắng/thua/rút lui và Về rừng. Giữ art Bright Handheld, góc nhìn side-view riêng trong combat. Chi tiết hệ thống tại `COMBAT_FLOW.md`; thông số cân bằng vẫn là bản đầu cần thử.

### Asset thế giới và nhân vật

- Chọn **B — Bright Handheld** ngày 2026-10-04.
- Ảnh chuẩn: `ai-workflow/mockups/pixel-art-asset-directions/B-bright-handheld.png`.
- Pixel art top-down 3/4, màu sáng, đường biên rõ, chibi đầu lớn thân nhỏ, môi trường Nam Lĩnh xanh tươi với mái ngói đỏ và nước xanh lam.
- Mọi scene, nhân vật, NPC, quái, vật phẩm và công trình mới phải lấy ảnh chuẩn B cùng `ART_BIBLE.md` làm reference. Không đổi tỉ lệ pixel, góc nhìn hoặc kiểu viền giữa các scene.
- Các bộ A, C, D, E là phương án bị loại, không dùng làm reference cho asset production.

### Cách review asset

- Khi cần chọn phương án cho scene hoặc nhóm asset mới, chỉ xuất các ảnh phương án A–E để người dùng xem trực tiếp.
- Không dựng trang web hoặc tiến trình chạy riêng chỉ để chọn ảnh, trừ khi người dùng yêu cầu lại.

### Yêu cầu sửa Scene 1 ngày 2026-10-04

- Người dùng yêu cầu nhà/nhân vật nhỏ hơn, đường rộng, hiển thị web sắc nét, đầy đủ tiếng Việt và môi trường có chuyển động.
- Chi tiết kỹ thuật và tiêu chí kiểm tra nằm trong `SCENE_QUALITY.md`; E trong `mockups/scene-01-scale-v2/` được chọn ngày 2026-10-05. Các chữ A–E này là mã bố cục, không thay bộ art B đã chốt.
- Thư viện nguồn dùng lại: `assets/manifest.json`. Ảnh có chữ/HUD hoặc nhân vật nhúng chỉ là mockup, không đưa nguyên ảnh vào nền gameplay.

### Đối chiếu lại ảnh E ngày 2026-10-06

Người dùng gửi lại `assets/references/scene-e-user-layout.png` và yêu cầu sửa bản chạy sát ảnh E, đặc biệt bố cục cây và số dân làng. Lựa chọn E tiếp tục có hiệu lực, không mở vòng mockup mới. Lượt sửa dùng cùng bộ B hiện có: cụm cây so le, sân trước có hàng rào theo phối cảnh, vườn hoa, bờ suối đá, tám NPC (ba nghề nghiệp và năm người dân đi lại). Tỉ lệ hiển thị đối chiếu ảnh mới: hero/NPC phụ dùng hero sheet cao tối đa 72 world px; NPC nghề nghiệp 70 px, nông dân 66 px, trẻ nhỏ 61 px. Nhà dùng khung 250–265 px và chiều cao 84% để gần góc nhìn trong ảnh. Các con số này thay mốc 44 px cũ cho lượt đối chiếu E này; hitbox chân và camera vẫn cùng tọa độ world. Kết quả kiểm tra thực tế ghi riêng trong báo cáo ngày 2026-10-06.

### Hồ sơ nhân vật và HUD gọn ngày 2026-10-07

Người dùng chọn **panel B — Hồ sơ cạnh phải**, bổ sung avatar lớn theo phương án A, và **lối chuyển map C — vòng sáng**. Tên điểm đến chỉ xuất hiện khi hover trực tiếp vào vòng sáng. Phạm vi duyệt còn gồm: bỏ thẻ nhiệm vụ ngoài HUD; bỏ thẻ địa danh phía trên và chuyển tên map/thời tiết xuống dưới minimap; bảng thoại chỉ hiện khi đang đi tới NPC đã chọn hoặc khi cuộc trò chuyện thực sự bắt đầu, và phải ẩn ngay khi người chơi đổi đích sang mặt đất.

Panel Nhân vật chỉ gồm avatar/tên, cấp nhân vật, hệ và cấp tu luyện, mười thuộc tính sức mạnh dạng số nguyên, cùng Ngộ tính/Căn cốt/Tâm cảnh. Mockup tham chiếu nằm trong `mockups/character-power-hud/`; số trong mockup là dữ liệu hiển thị ban đầu, chưa phải quyết định cân bằng chiến đấu.

### Bảng chỉ đường chuyển map ngày 2026-10-07

Người dùng chọn **bảng A — bảng gỗ liền mũi tên** tại `mockups/map-direction-signs/A.png`, sau ba vòng chỉnh tỉ lệ. Quyết định này thay thế lối chuyển map C — vòng sáng ở mục trên.

- Bỏ hoàn toàn vòng sáng/dấu chấm chuyển map; mỗi cổng dùng một bảng gỗ nhỏ thuộc bộ B Bright Handheld.
- Bảng nằm sát vùng chuyển map và lệch sang bên để không chặn đường; chân bảng có collider nhỏ, route tới tâm cổng vẫn thông.
- Kích thước bảng nhỏ hơn NPC. Tên địa điểm luôn nằm trên mặt bảng, lấy từ locale Việt/Anh; artwork không chứa chữ.
- Mũi tên chĩa về vùng chuyển map. Hover chỉ tạo viền sáng nhẹ trên asset, không mở tooltip/callout nổi.
- Asset nguồn `assets/production/signpost-A.png`, bản runtime `game/public/assets/production/signpost-A.png`, metadata trong `assets/manifest.json` với ID `production.signpost-A`.

### Rừng Thanh Trúc — diễn giải E ngày 2026-10-15 (đã bị thay thế)

Người dùng chọn **E — Thung lũng bậc đá**, tham chiếu `mockups/thanh-truc-forest-expansion/E.png`, và yêu cầu triển khai. Thác nhiều tầng ở phía tây, nhà hoang mái sụp trên thềm phía đông bắc, hai lối bậc đá và đường uốn quanh các cụm cây/trúc, đá/sỏi, linh thảo. Giữ art Bright Handheld B và HUD/flow combat B. Bốn loài gồm Mộc Yêu non, Bào Tử Yêu, Trúc Diệp Xà cấp 1 và Thanh Nham Thú cấp 2; thú đá đứng trên bãi khô nối đường cạnh thác. Linh thảo có hai loại cấp 1 và hai loại cấp 2, sáu cụm mới; giữ nguyên vật phẩm cũ để bảo toàn save. Thông số quái và hồi hái 20 giây kế thừa runtime là cân bằng triển khai ban đầu, không phải thông số người dùng đã chốt. Không thay đổi quy tắc lượt đánh hoặc thêm XP/loot quái. Kết quả thực chạy ở `reports/forest-E-2026-10-15.md`.


### Rừng Thanh Trúc — đối chiếu ảnh người dùng ngày 2026-10-16

Người dùng xác nhận **E là hình 1 đính kèm**, lưu nguyên bản ở `../assets/references/forest-selected-2026-10-16.png`. Diễn giải E thành thung lũng bậc đá ngày 2026-10-15 là sai. Ảnh đính kèm này có ưu tiên hơn tên file/phương án cũ; không mở lại bước chọn mockup.

Bố cục cần giữ: nhà hoang mái đỏ góc trên trái, thác ở giữa phía trên, suối uốn chia hai bờ, cầu gỗ nằm ngang ở giữa, bãi thú đá phía dưới trái và đường vòng phía đông. Giữ mật độ cây/trúc/hoa/đá và tỉ lệ theo ảnh. Runtime dùng nền đã loại bỏ actor, nhà, cầu và biển chỉ đường; công trình, quái, nhân vật, tài nguyên, biển và hiệu ứng được vẽ riêng. Các polygon đi được, mặt cầu và lớp tán che sử dụng cùng hệ tọa độ ảnh tham chiếu. HUD, hành trang và combat B giữ quy tắc đã duyệt. Kết quả thực chạy xem `reports/forest-correction-2026-10-16.md`.

### Rừng E — sửa cách dựng scene 16–17/10/2026

Người dùng yêu cầu làm lại asset, animation và skill quái, giữ ảnh E đã xác nhận. Runtime đã chuyển sang `ground-v3` chỉ chứa địa hình/đá/hoa thấp; nhà/cầu, cây/trúc/hoa thân gỗ, quái/linh thảo, nước/thác và foreground là các lớp riêng. Các sprite cây dùng biến dạng theo chiều cao với gốc đứng yên, z-order theo chân và collider cùng tọa độ. Nước dùng atlas surface/fall 4 frame với mask bờ đo offline; mask chỉ phục vụ hiệu ứng, không thay navigation. Quái có idle atlas riêng 4 frame/loài. Nền được vẽ trực tiếp từ nguồn vào backing store theo camera/DPR, không qua canvas nền trung gian. HUD và bố cục E không mở vòng chọn lại. Chi tiết test mới ở `reports/forest-rebuild-2026-10-17.md`.
