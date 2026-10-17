# Flow chiến đấu — Rừng Thanh Trúc

## Nâng cấp quái ngày 2026-10-12 — đã triển khai và kiểm thử desktop Chrome

Người dùng cho phép bỏ mockup và triển khai thẳng, giữ UI B. Quái có cùng mười thuộc tính sức mạnh với người chơi, bốn skill/quái, sát thương theo công thức ghi chú gốc và AI chọn chiêu có trọng số theo tình huống/chỉ số. Chi tiết kỹ thuật và mapping real-time: `MONSTERS.md`. Báo cáo mới: `reports/monster-ai-2026-10-12.md` (45 unit pass, full browser cũ 21 pass, bộ combat mở rộng mới nhất 12/12 pass). Bộ công thức hard-code và luân phiên chiêu của bản 2026-10-11 đã được thay thế.

Ngày yêu cầu: 2026-10-11. Trạng thái: **đã triển khai B — Sân đấu thoáng, đã kiểm thử bản desktop Chrome**. Nguồn: `game/src/combat/`, `game/src/engine/scene.ts`, `App.tsx`, `locales/{vi,en}.json`. Bằng chứng/giới hạn: `reports/forest-combat-B-2026-10-11.md`.

## Yêu cầu của người dùng

- Quái trong map có tối đa 10 lượt chiến đấu. Bấm quái để xem số lượt còn lại. Dùng một lượt: 10/10 → 9/10; sau khi xong trận, 5 phút sau hồi lại 10/10.
- Bấm Chiến đấu chuyển sang màn riêng, hành động thời gian thực nhìn ngang, lấy cảm giác di chuyển/nhảy/né của Rockman làm tham khảo. Có nút di chuyển, tấn công, phòng thủ, kỹ năng và bay nhảy né chiêu.
- Lưu quy tắc vào skill, context và harness để phát triển các phần tiếp theo theo một flow xuyên suốt.
- Art vẫn B Bright Handheld, nhân vật/quái nguyên bản. Góc nhìn ngang là yêu cầu riêng cho combat, không đổi góc nhìn khám phá.
- **Chỉnh sửa đã chốt khi chọn B:** ngoài map chỉ hiện số lượt còn đánh được của quái. Không hiện các khung flow đầy lượt/hết lượt/kết quả trong trận. Không hiện lượt ở HUD hoặc kết quả; không hiển thị countdown, mốc hồi hay giải thích quy tắc hồi cho người chơi ở bất kỳ màn nào. Hồi lượt chạy ngầm. Kết quả trận chỉ báo thắng/thua/rút lui và nút Về rừng.

## Quy tắc triển khai bản đầu

- Bản đầu áp dụng bể riêng từng quái rừng và hồi từng lượt **độc lập** sau 300.000 ms tính từ lúc trận tương ứng kết thúc, theo diễn giải đã nêu trong thiết kế. Người dùng chốt giữ rule 5 phút/lượt và ẩn việc hồi; chưa yêu cầu chuyển sang hàng đợi hồi tuần tự. Nếu sau này đổi chính sách, cần migration save và test tương ứng.
- Chỉ trừ lượt khi đã tải đủ asset và thực sự vào trận. Mở/đóng thẻ quái hoặc tải lỗi không mất lượt. Khoá nút đang chuyển màn; một encounter ID chỉ trừ đúng một lượt.
- Thắng, thua hoặc chủ động rút lui đều là kết thúc trận và bắt đầu hồi lượt. Reload giữa trận được coi là rút lui tại lúc mở lại; ghi nhận đúng một lần. Các quy tắc này là chi tiết hệ thống, không thêm giải thích hồi lượt vào UI.
- Bay nhảy ở bản đầu: nhảy thường + một lần khinh công trên không (nhảy lần hai); chưa đề xuất bay tự do vô hạn.
- Chỉ số, sát thương, cooldown kỹ năng và phần thưởng trong mockup là số minh hoạ; chưa cân bằng và chưa phê duyệt kinh tế game.

## Luồng xuyên suốt

1. Khám phá: click quái → nhân vật tìm đường tới vị trí tiếp cận hợp lệ. Không mở trận từ xa hoặc xuyên vật cản.
2. Thẻ quái ngoài map: tên, một dòng `Còn n/10 lượt chiến đấu`, Chiến đấu và Đóng. 0/10: vô hiệu Chiến đấu, nhãn Hết lượt chiến đấu. Không countdown, không mốc hồi, không giải thích 5 phút. Click mặt đất huỷ tiếp cận/đóng thẻ.
3. Chuẩn bị: lưu map/vị trí/hướng quay về; tải asset. Tải lỗi → giữ nguyên lượt, cho thử lại. Tải xong → tạo encounter, trừ một lượt dưới khoá phiên nhiều tab, khoá input khám phá. Snapshot mười thuộc tính từ base `stats.ts` cộng trang bị (`items/stats.ts`, từ 2026-10-13) và catalog quái khi vào trận; hồ sơ nhân vật dùng cùng nguồn. Đọc `EQUIPMENT.md` khi thay đổi đồ/save; không đổi trang bị trong trận. Chưa có lựa chọn hệ tu luyện/progression.
4. Trong trận: canvas riêng theo góc nhìn ngang; HUD HTML. Trái/phải, nhảy/khinh công, lướt né, đánh, giữ đỡ, kỹ năng. Pause riêng, không dùng nút Quay lại để thoát trận âm thầm. Tab ẩn/mất focus → pause và nhả tất cả nút giữ.
5. Kết quả: thắng/thua/rút lui và Về rừng. Không số lượt/countdown/tái đấu tại màn kết quả. Bắt đầu hồi đúng một lần trong hệ thống. Phần thưởng/XP chưa có quy tắc được duyệt nên bản đầu chưa tự thêm kinh tế; khi bổ sung phải ghi idempotent theo encounter ID. Muốn đánh tiếp thì về rừng và bấm quái.
6. Trở về: phục hồi map/vị trí an toàn/hướng nhìn, không đưa lại màn chọn nhân vật, không tự kích hoạt trận/cổng. Giữ túi và tiến trình hiện có. Huỷ input, RAF, đạn, âm thanh và emitter của trận cũ.

## Thiết kế thao tác chung cho A–E

| Hành động | Bàn phím đề xuất | Nút trên màn hình | Tài nguyên / phản hồi |
|---|---|---|---|
| Trái / phải | A / D hoặc ← / → | Hai nút hướng | Điều khiển liên tục khi giữ |
| Nhảy / khinh công | Space, lần hai khi trên không | Nhảy | Một lần khinh công trước khi chạm đất |
| Đánh thường | J | Tấn công | Chuỗi ngắn, có thời gian ra đòn/hồi đòn |
| Phòng thủ | Giữ K | Giữ Đỡ | Tốn thể lực, chỉ đỡ hướng đang quay, vỡ thủ khi cạn |
| Lướt né | Shift | Lướt | Tốn thể lực, cooldown, cửa sổ né có giới hạn |
| Kỹ năng tân thủ | L | Kỹ năng | Tốn linh lực; hiện cooldown, vô hiệu khi chưa đủ tài nguyên |
| Tạm dừng | Esc | Tạm dừng | Tiếp tục, rút lui có xác nhận trong game |

Đây là thiết kế thao tác, không sao chép nhân vật/asset/UI Rockman. Nút cảm ứng tối thiểu 48 CSS px; cho phép giữ hướng đồng thời nhảy/đánh; xử lý pointer capture, pointercancel, blur. Desktop là phạm vi kiểm thử hiện có; không tuyên bố hỗ trợ điện thoại thật nếu chưa thử.

Mỗi quái hiện có bốn skill tại `game/src/combat/monsters.ts`. AI chọn có trọng số theo range, trạng thái, tài nguyên và cooldown, giảm lặp. Mộc Yêu dùng hạt, rễ, quét cành và lao tới; Bào Tử dùng cầu, vùng đất, bắn quạt và đập mũ. Telegraph khóa đích/hướng, phản ánh hitbox, hiện cả khi giảm hiệu ứng; đủ khoảng nghỉ cho phản công. Xem `MONSTERS.md` về công thức, chỉ số và mapping real-time.

Đòn chỉ gây sát thương khi hitbox chạm hurtbox và không ở cửa sổ bất tử; không dùng RNG né để phủ nhận thao tác đã né thành công. Mỗi melee/ground/dash đánh một lần mỗi cast; mỗi viên đạn là một hit. Công thức gốc của ba hệ trong ghi chú 2026-10-04 được dùng chung ở `stats.ts`. Đỡ giảm sát thương sau công thức. Không còn sát thương chạm quái thụ động. Nhân vật hiện chưa chọn hệ: dùng đánh vật lý/kỹ năng pháp thuật tân thủ, không tự gán hệ tu luyện.

## Lưu lượt và thời gian (thiết kế kỹ thuật)

- Tách đồng hồ wall-clock của hồi lượt khỏi delta simulation và đồng hồ animation. Không dùng `setInterval` làm nguồn sự thật, không dùng `sim.time` vì nó dừng khi đóng tab.
- Save có version: theo quái lưu encounter đang hoạt động và danh sách `readyAt` của lượt đang hồi. `available = 10 - activeCount - pendingRechargeCount` sau khi bỏ mốc đã tới hạn; luôn trong [0,10]. Snapshot kết quả giữ encounter ID để xử lý một lần.
- Hai trận xong tại 10:00 và 10:02 thì mỗi lượt về tại 10:05 và 10:07. Không dồn thành 10:05 và 10:10; không hồi cả bể cùng lúc. Không đưa ví dụ hoặc thời gian này lên giao diện người chơi.
- Save trước khi đổi màn và tại kết thúc; reload/mở lại tính theo thời gian tuyệt đối. Lỗi storage phải báo khả năng lưu, không âm thầm khẳng định đã lưu. Dữ liệu sai có validation/migration, không reset toàn bộ tiến trình người chơi.
- MVP local là lưu trên thiết bị như hiện trạng; không giả định đã có tài khoản/backend/chống chỉnh đồng hồ. Khi có backend, server làm nguồn thời gian và transaction; đồng bộ nhiều tab phải tránh trừ/nhận hai lần.

## Kiến trúc triển khai sau duyệt

Giữ React + TypeScript + Canvas 2D. Module thuần cho lượt hồi và combat simulation; renderer, input và HUD tách biệt. Máy trạng thái `exploration → encounter → loading → combat → result → exploration`; pause là trạng thái con của combat. Data-driven encounter dùng cùng flow cho rừng/núi/map mới. Không cập nhật React mỗi frame, không dùng tên bản dịch làm ID. Thêm locale vi/en và asset sideways/animation riêng qua manifest; ảnh concept không phải asset runtime.

## Hồ sơ và nghiệm thu

- Mockup: `ai-workflow/mockups/forest-combat/B.png` đã chọn, kèm sửa UI ở trên. Bộ ảnh cũ là lịch sử thiết kế; chữ số lượt/countdown và dải flow trong ảnh không còn là yêu cầu runtime.
- Ma trận harness: `ai-workflow/harness/combat-cases.json` và `monster-cases.json` ghi phạm vi, ánh xạ test và giới hạn. Test thực thi: `game/test/combat.test.mjs`, `game/test/monsters.test.mjs`, `game/test/browser/combat.spec.ts`. Không coi ma trận JSON là test executable, không suy pass cho phần ghi chưa kiểm tra.
- Lệnh nghiệm thu sau triển khai: từ `game/` chạy `npm run verify`; kiểm thử production đủ lượt/hồi/offline/reload, combat/input, đi và về, vi/en, DPR/resize, console và hiệu năng. Ghi case nào pass/fail/chưa chạy cùng bằng chứng.
- Đã qua bước chọn và triển khai của `FEATURE_WORKFLOW.md`; người dùng cho phép nâng logic 2026-10-12 không mockup mới. Chỉ số chưa cân bằng cuối, arena là mặt đất phẳng, chưa có phần thưởng/XP hoặc chọn hệ tu luyện; công thức ba loại sát thương đã có.
