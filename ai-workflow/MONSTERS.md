# Dữ liệu quái và AI chiến đấu

Yêu cầu 2026-10-12; đã triển khai và kiểm thử desktop Chrome, xem `reports/monster-ai-2026-10-12.md`. Người dùng cho phép bỏ mockup, giữ UI B. Áp dụng cho hai quái Rừng Thanh Trúc. Bốn kỹ năng mỗi quái; chỉ số ban đầu là cân bằng do AI triển khai, có thể chỉnh sau thử chơi.

## Nguồn và hợp đồng

- `game/src/combat/monsters.ts`: danh mục quái, mười chỉ số, tham số AI, kỹ năng, sprite và vị trí rừng. Mỗi skill có tên vi/en cho người đọc source, loại sát thương/hệ số, giá tài nguyên, cooldown, trọng số, tầm sử dụng, báo chiêu và hình học hitbox.
- `game/src/combat/stats.ts`: bộ chỉ số người chơi dùng chung với hồ sơ; ba công thức thuần. Không tự gán hệ tu luyện cho nhân vật chưa chọn hệ. Đánh tân thủ vật lý và kỹ năng linh lực pháp thuật được cấu hình riêng.
- `game/src/combat/ai.ts`: chọn chiêu có trọng số trên danh sách đủ điều kiện, RNG seed được để test/replay. Runtime mỗi trận seed mới. Không cần API/LLM/backend.
- Nguồn công thức: `Game Tiên Hiệp/## 2026-10-04 Hệ thống tu luyện và sức mạnh và skill`.

Vật lý = max(1, công × hệ số − phòng ngự). Pháp thuật = max(1, công × hệ số − kháng pháp). Kiếm = max(1, (công + sát phạt) × hệ số − phòng ngự − kháng pháp). Giữ số lẻ trong simulation; hệ số từ 1 tới 10, bước 0,5. Đỡ áp dụng sau công thức, giữ 15% và làm tròn lên; né đúng cửa sổ không nhận sát thương. Không thêm RNG trượt/crit vào công thức.

## Mapping real-time (quyết định triển khai, không phải công thức gốc)

Sinh mệnh/thể lực/linh lực là trần tài nguyên. Công/phòng ngự/kháng pháp/sát phạt dùng trong công thức. Tốc độ điều chỉnh chạy và nhịp ra đòn, có clamp. Chính xác giới hạn độ lệch góc/vị trí nhắm của quái; không cho đạn đã né trúng lại vì một lần tung xúc xắc. Ý chí giảm thời gian khựng do nhận sát thương; báo chiêu đã bắt đầu không bị hủy hoặc đổi mục tiêu âm thầm. Ngộ tính/căn cốt/tâm cảnh thuộc tu luyện, không phải mười thuộc tính combat và chưa áp dụng cho quái.

AI xem khoảng cách, trạng thái trên không/đỡ, máu bản thân, tài nguyên và cooldown. Chọn ngẫu nhiên có trọng số, giảm lặp chiêu vừa dùng; không chọn chiêu chưa hồi/không đủ tài nguyên. Khóa hướng/đích khi bắt đầu báo chiêu; báo trước tối thiểu 0,45 giây. Mọi vùng sát thương có hình báo tương ứng, vẫn hiện khi giảm hiệu ứng. Mỗi lần thi triển melee/dash/ground đánh một lần; từng viên trong volley là một hit riêng và chịu iframe. Không gây sát thương va chạm thụ động không báo trước.

## Nghiệm thu cần chạy

Công thức ba loại, đổi chỉ số thực sự đổi sát thương/nhịp/nhắm/khựng; toàn bộ skill catalog; eligibility và phân bố AI nhiều seed; cùng seed cùng kết quả; không đổi đích khi báo chiêu; né/đỡ/mỗi cast một hit; pause/terminal; charge cũ qua registry mới; flow browser thắng/thua/return, hai quái, vi/en, layout/performance. Ghi kết quả thực trong báo cáo và `harness/monster-cases.json` sau khi chạy.

## Các kỹ năng đang cấu hình

| Quái | Skill | Cơ chế | Loại sát thương |
|---|---|---|---|
| Mộc Yêu non | Liên Hạt | Ba viên đạn nối tiếp, khóa hướng nhắm | Vật lý |
| Mộc Yêu non | Địa Căn | Rễ tại vị trí đã báo, không thể đỡ | Pháp thuật |
| Mộc Yêu non | Hoành Chi | Quét cành phía trước | Vật lý |
| Mộc Yêu non | Mộc Xung | Lao trên đoạn đường đã báo | Vật lý |
| Bào Tử Yêu | Phi Bào | Ba cầu bào tử nối tiếp | Pháp thuật |
| Bào Tử Yêu | Bào Vực | Vùng bào tử, không thể đỡ | Pháp thuật |
| Bào Tử Yêu | Tán Bào | Năm viên đồng thời hình quạt | Pháp thuật |
| Bào Tử Yêu | Chấn Tán | Đập mũ nấm phía trước | Vật lý |

Số cân bằng chính xác ở catalog. Hai quái này có sát phạt 0 và chưa có chiêu loại kiếm; công thức kiếm đã có và được kiểm thử để thêm skill sau. Level hiện là metadata, không tự nhân sát thương theo level. Chưa có kháng trạng thái sợ hãi hoặc tu luyện quái; ý chí chỉ giảm khựng. Chính xác của người chơi được lưu chung nhưng đánh do người chơi điều khiển chưa dùng RNG chính xác.

Mapping cụ thể: speedFactor = clamp(speed/16, 0,65, 1,5); windup = max(0,45, skill.windup/speedFactor); recovery + thời gian nghĩ được chia speedFactor. Người chơi chạy/nhịp đánh cũng dùng speedFactor. Khựng = 0,24/(1 + willpower/20) giây; người chơi chạy chậm một nửa khi khựng, không bắt đầu đánh/skill mới, vẫn nhảy/lướt được; quái khựng chỉ trì hoãn đi/chọn chiêu khi nghỉ, không hủy chiêu đang báo. Aim lệch X tối đa max(2,70/(1 + accuracy/5)) world px, tung một lần khi bắt đầu cast.

## Thêm quái vào rừng

1. Thêm một entry ID mới vào `MONSTERS` trong `game/src/combat/monsters.ts`. Giữ ID ổn định; sao chép cấu trúc của quái gần nhất và chỉnh tên vi/en, level, đủ 10 stats, vị trí `forest`, sprite và AI.
2. Cấu hình 3–5 skill với ID riêng trong quái. `projectile` hỗ trợ volley hoặc fan; `ground` là vùng đất; `melee` đánh phía trước; `dash` lao theo đoạn đường. Khi dùng lại những kiểu này không sửa simulation/AI/renderer/charges.
3. Hệ số 1–10 bước 0,5; `range` là tầm AI cân nhắc, `radius/height/travel` là hình va chạm thật. Có thể hụt nếu người chơi rời vị trí sau báo chiêu. `cooldown` bắt đầu khi cam kết cast; tài nguyên trừ một lần lúc đó. Chọn loại damage phù hợp, không đặt raw damage.
4. `name` trong catalog là nguồn dịch tên quái; các key tên cũ ở locale chỉ để tương thích. Vị trí rừng, tên, ID hợp lệ, bể lượt và sprite combat đều được lấy tự động từ catalog. Save v1 cũ tự có mảng trống cho ID mới; giữ các ID ngừng dùng. Không đổi schema nếu chỉ thêm quái.
5. Đặt vị trí không nằm trong vật cản và có lối tiếp cận. `npm run verify` kiểm tra map, locale, công thức, từng executor và flow. Mở quái mới trong bản chạy để xác nhận hình, hitbox, dễ đọc, độ khó. Bộ sprite hiện chỉ có hai hàng quái: tái sử dụng được cho biến thể; hình quái mới cần asset/frame metadata và review riêng, không giả vờ một dòng catalog tạo được artwork mới.

## Công cụ và giới hạn

`game/test/monsters.test.mjs` bao gồm test từng skill tự duyệt catalog. Fixture visual: chạy dev server 4174, rồi `node tools/review-monster-skills.mjs`; xuất ảnh warning/active cho cả tám skill với giảm hiệu ứng. Đây là fixture source/renderer qua Vite, tách khỏi test production có điều khiển thật.

Chỉ hỗ trợ đăng ký tự động cho Rừng Thanh Trúc ở lần này. Map núi chưa mở combat; map mới cần thêm placement/return flow tương ứng. Skill có cơ chế mới ngoài bốn kind cần executor + renderer + test. Chưa có progression, thưởng XP/vật phẩm, hệ tu luyện được chọn hay backend; đây là bộ cân bằng đầu tiên, chưa có playtest dài hạn hoặc điện thoại thật.

## Mở rộng rừng E ngày 2026-10-15

Rừng hiện có thêm Trúc Diệp Xà cấp 1 và Thanh Nham Thú cấp 2, mỗi loài bốn chiêu dùng các executor hiện hữu. Ba loài cấp 1, một loài cấp 2. Cấp quái được kiểm tra trong 1–15; chưa triển khai đủ 15 cấp. `art.sheet` chọn sheet combat, `art.mapTile` chọn hình ngoài map; metadata mới ở `engine/forest-frames.json`. Chỉ số và trọng số hai quái mới là cân bằng ban đầu. Ledger tự thêm ID mới, giữ nguyên lịch sử cũ. Luồng, rule lượt và UI B không đổi. Test mới: `test/browser/forest.spec.ts`, vòng lặp executor trong `test/monsters.test.mjs`; kết quả thực ở `reports/forest-E-2026-10-15.md`.

## Làm lại rừng 16–17/10/2026

Yêu cầu mới: làm đúng asset/chuyển động và chiêu riêng, không chỉ thay hình trên logic cũ. Lựa chọn E và HUD combat B tiếp tục có hiệu lực. Chi tiết cân bằng dưới đây là quyết định triển khai, không phải con số người dùng chỉ định.

- Bốn loài có atlas idle top-down 4 frame riêng (`monsters-idle-v4.png`); combat tiếp tục dùng các pose side-view chuyên dụng, frame nghỉ/đi/báo/nện/cắn theo trạng thái thật. Ngoài map quái giữ lãnh địa, animation idle; chưa thêm roaming/chase.
- Mộc Yêu: Địa Căn gây chậm 45% trong 1,2 giây nếu trúng không đỡ; các chiêu hạt/rễ có art đúng vật thể. Bào Tử Yêu giữ volley/fan/vùng bào tử/đập mũ, art bào tử riêng. Không đổi stable monster IDs hoặc ledger.
- Trúc Diệp Xà: Phi Diệp là ba lá bắn quạt đồng thời; Quét Đuôi thấp có thể nhảy qua; Xà Nha cận chiến gây chậm 35% trong 1,6 giây khi trúng không đỡ; Xà Ảnh lao thấp 400 px theo hướng khóa. Không còn bản sao bộ rễ/volley Mộc Yêu.
- Thanh Nham Thú: Địa Chấn lan sát đất từ chỗ quái theo hướng khóa (620 px / 1,2 giây), có thể nhảy né; Nham Trồi ba điểm khóa tại đích và ±100 px, hoạt hóa lần lượt cách 0,3 giây, mỗi điểm 0,38 giây, cả cast tối đa một hit; Thạch Trảo nện gần; Nham Xung húc nặng và hồi lâu.
- `geometry.ts` dùng chung vị trí/timing ground hazard cho collision và renderer. Pattern `wave`/`sequence` là cấu hình trên executor ground. Warning vẽ đủ hành lang/ba vị trí ngay lúc khóa; active chỉ gây sát thương tại vùng đang hoạt động. Dash warning được clamp theo biên arena, active vẽ vùng quanh thân đang lao.
- Chậm chân chỉ áp dụng khi hit hợp lệ, qua iframe và không bị đỡ; pause đóng băng thời gian, terminal không tiếp tục cập nhật. Không sát thương chạm người thụ động. Quy tắc mỗi cast một hit, formula stats, cooldown/weighted AI, save và lượt vẫn giữ.
- Hiệu ứng attack dùng `skill-effects-v4.png` với 8 source rect đo từ alpha: hạt, bào tử, lá, ngọc; rễ, mây bào tử, trúc, đá ngọc. Prompt chính xác ở `assets/prompts/forest-rebuild-2026-10-16.json`.
- Test mới trong `monsters.test.mjs`: thời gian lan thực/jump, ba điểm khóa/timing, chậm chân ảnh hưởng quãng đường/hết hạn/đỡ/iframe. Kết quả chạy mới và giới hạn ở `reports/forest-rebuild-2026-10-17.md`.
