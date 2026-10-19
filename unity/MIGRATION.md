# Bàn giao chuyển Unity — 2026-10-17

**Target hiện tại: Unity 6.3 LTS (6000.3.26f1)** theo yêu cầu nâng cấp sau bản port 2022.3. Xem [`UNITY6.md`](UNITY6.md) cho cấu hình/package/API và bằng chứng kiểm tra mới nhất. Các kết quả compiler dùng reference cũ bên dưới là lịch sử, không chứng minh Unity 6 đã import/build.

## Phạm vi nguồn thực tế

Nguồn đã khảo sát: `game/src`, `game/public/assets/production` và tài liệu quy tắc của repo TuTien2D. Không tự cập nhật `ai-workflow/CONTEXT.md`.

**Đã port mã nguồn/dữ liệu cho các phần sau; không đồng nghĩa đã chạy thành công trong Unity.** Rà soát ngày 2026-10-18 tìm và sửa lỗi trong bản đầu; kết quả chi tiết ở [`AUDIT.md`](AUDIT.md).

- Bốn map Làng Trúc Khê, Rừng Thanh Trúc, Núi Xích Nham, Đường Thiên Lộ; tọa độ, vật cản, vùng đi được, mặt cầu, cổng và spawn lấy trực tiếp từ runtime hiện tại.
- Bốn ngoại hình; animation theo metadata khung đo; NPC di chuyển/trò chuyện, nhiệm vụ gặp ba NPC, thu thập và cooldown theo từng cây.
- A* và swept collision, tìm điểm tiếp cận quanh actor, camera theo người chơi, minimap nhận click, sắp xếp sprite theo chân.
- Bốn quái rừng, mười chỉ số, 16 skill, AI có trọng số/RNG seed, đạn quét va chạm, báo chiêu khóa đích, nhảy đôi, đỡ, lướt, chậm, pause, kết quả và trở về map.
- 23 item, 100 ô túi, 10 slot, starter một lần, stacking, trang bị/so sánh bonus, overflow, snapshot chỉ số khi vào trận.
- Ledger 10 lượt từng quái, hồi độc lập 300.000 ms sau kết thúc, idempotency và phục hồi trận bị gián đoạn.
- Locale Việt/Anh, font có dấu, âm thanh, giảm chuyển động, lớp nước, foliage có gốc cố định, lá/bướm, lửa/khói/tàn lửa.
- Save native có validation, lease một instance, ghi thay file nguyên tử, backup và import save web.
- Main scene, GUID ổn định, package/import/build settings, menu Editor và Play Mode harness.

Không biến thiết kế chưa có trong runtime thành tính năng mới: chưa có XP/loot sau trận, hệ tu luyện có progression, tài khoản/cloud save hoặc thay ngoại hình theo trang bị. Quái ở núi vẫn chỉ có hội thoại như nguồn. Bản chuyển giữ game 2D trong Unity; không tạo mô hình 3D.

## Bằng chứng kiểm tra

- Core C#: đối chiếu combat với TypeScript ở 12 replay (4 quái × 3 seed), 10 snapshot mỗi replay; kiểm tra HP/tài nguyên/vị trí/cooldown/trạng thái/đạn/chuỗi quyết định.
- Navigation: 33 đích actor/cổng trên 4 map; so điểm tới với nguồn, kiểm từng đoạn và bước đi có độ dài khác nhau.
- Logic: công thức damage, đủ 16 skill, khóa mục tiêu, pause/đỡ/iframe/nhảy, inventory đầy/hoán đổi/overflow, ledger, save/import/corruption và các chuyến đi/về cổng bằng world simulation native.
- C# Core + Runtime được biên dịch bằng .NET SDK với reference assemblies UnityEngine.Modules **2021.3.33**, UnityEngine.UI **2018.3.5.1**: đây là kiểm tra compiler/API bổ sung, **không phải** import/build bằng Unity 2022.3.62f1. Reference/toolchain đặt ngoài repo, không nhúng vào project.
- Kiểm tra cấu trúc: 89 hash nguồn, 61 PNG, mọi source rectangle đã dùng, GUID, liên kết scene và tên assembly. Bản sao production khớp byte nguồn.
- Bản web tham chiếu: 74 unit test pass, 77 asset/0 pending review, TypeScript/Vite build pass. Không chạy lại Playwright vì mã web không thay đổi; kết quả web không chứng minh UI Unity chạy đúng.

Kết quả cuối và số ca core xem `Validation/last-run.txt`. Mọi bài Unity Play Mode bên dưới là **chưa chạy**, không cộng vào số pass.

## Cần nghiệm thu bằng Unity

Chưa tìm thấy Unity Editor trong cloud hiện tại; chưa thực hiện activation hay chạy Editor. Vì vậy chưa xác nhận:

1. Package resolve/import, compile shader và script bằng đúng Editor 6000.3.26f1.
2. Play Mode: creator → map → NPC/gather → inventory → forest combat → result → đúng map/vị trí; đổi locale, reload/save lỗi và mất focus.
3. Hình ảnh/sorting/pivot/font, camera và UI ở 1280×720, 1920×1080, resize; thông báo và nút cảm ứng. UI được dựng lại bằng Unity UI, chưa có ảnh render Unity để so trực tiếp bố cục web đã duyệt.
4. Player build Windows/Linux/macOS, FPS, bộ nhớ, thiết bị di động và WebGL.

Nền/minimap được bake từ renderer gốc để giữ bố cục. Nước rừng dùng bốn lớp frame đã mask; foliage dùng mesh 20 dải với shader lay từ gốc. Các hiệu ứng/native UI cần duyệt hình trong Editor; không coi kiểm tra compiler hoặc hash là kiểm tra hình ảnh.

## Chạy tiếp

Mở `Main.unity`, dùng **Truc Khe → Validate Project**, chạy 19 test Play Mode rồi kiểm tra hình trực tiếp và build. Hướng dẫn chi tiết ở `README.md`. Nếu test/import báo lỗi, giữ log thật và sửa phần tương ứng trước khi đánh dấu chuyển đổi đã nghiệm thu đầy đủ.

Đợt mobile tiếp theo ngày 2026-10-18 thêm cấu hình Android/iOS, launcher và xử lý cảm ứng/lifecycle. Kết quả mới: 94 core checks và 5 launcher checks pass; Play Mode/player vẫn chưa chạy. Xem [`MOBILE.md`](MOBILE.md) để build APK/AAB/Xcode và nghiệm thu trên thiết bị.

Sau khi người dùng chọn UI A, source bổ sung layout điện thoại riêng; tổng core checks hiện là 101, Play Mode có 19 ca chưa chạy. Xem [`MOBILE-UI.md`](MOBILE-UI.md) cho phạm vi và giới hạn kiểm tra mới nhất.
