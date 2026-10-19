# Rà soát bản chuyển Unity — 2026-10-18

Đây là báo cáo đợt audit trước phần mobile. Cập nhật Android/iOS và kết quả kiểm tra mới nhất ở [`MOBILE.md`](MOBILE.md); các số 87 core/9 Play Mode/103 GUID bên dưới là số tại thời điểm audit.

**Kết luận: chưa đủ điều kiện gọi là full project Unity đã chạy và nghiệm thu.** Mã nguồn/dữ liệu đã port, các kiểm tra thực thi ngoài Unity bên dưới đạt. Rà soát phát hiện lỗi trong bản bàn giao đầu và đã sửa; adapter, shader, hình ảnh và player vẫn cần chạy bằng đúng Unity Editor.

Nguồn web ở commit `92de8b710a1de136215b94c18fbb48ef30404140`. ZIP trước đợt rà soát có SHA-256 `cf440e11b064ee1f5b2e2aa86bce06dc6a3ed47aa4f8cda920d2b4354e32b55c`. Không sửa runtime web hoặc CONTEXT.

## Kiểm tra từng nhóm đã báo port

| Nhóm | Đã xác minh trong đợt này | Còn chưa xác minh |
|---|---|---|
| 4 map, cổng, collider, spawn | 33 route đối chiếu TypeScript; 3 vòng đi/về cổng bằng C#; xuất lại dữ liệu/nền khớp byte | Chơi/click/collider trực tiếp trong Unity |
| 4 hero, NPC, gather, quest | Metadata/rect hợp lệ; tiếp cận NPC và cooldown resource trong simulation | Animation, nhãn, quest UI và cả 4 hero trên 4 map trong Editor |
| Camera, minimap, sorting | Rà mã phép đổi tọa độ, tài nguyên và liên kết | Click sau resize, sorting/pivot, DPI, ảnh ở 1280×720 và 1920×1080 |
| Combat, 4 quái, 16 skill | 12 replay × 10 snapshot khớp nguồn; 16 executor; AI, sweep, ground sequence, slow, pause/terminal | Input thật, telegraph nhìn thấy, pause/focus và toàn luồng vào/ra trận Unity |
| Inventory, 23 item, 100 ô, 10 slot | Hoán đổi/đầy túi/overflow; 100 chu kỳ bảo toàn instance; snapshot stats; import giữ đồ | Bố cục, scroll/search/filter/detail, pointer và keyboard trong Unity |
| Ledger và hồi lượt | Hết lượt; biên 300.000 ms; hồi độc lập; duplicate reserve/finish; giữ ID cũ; khôi phục qua hai lần mở save | Hiển thị thẻ quái và xử lý lỗi lưu trong UI Unity |
| Save native và import | Validation; lỗi ghi temp/lỗi replace không đổi file và memory; retry/backup; khóa giữa hai tiến trình .NET trên Linux; import parsed/raw | Hành vi I/O dưới Unity Mono trên Windows/macOS; lỗi lưu và retry bằng nút thật |
| Locale, font, audio, hiệu ứng | Literal locale vi/en, font/audio tồn tại, metadata và hash; sửa mesh cây sai đơn vị | Shader compile, mesh thực tế, nghe audio, chữ có dấu, giảm chuyển động, FPS/bộ nhớ |
| Project/scene/build | GUID và scene/asmdef references; Core+Runtime compile bằng reference assemblies cũ | Resolve/import và compile đúng 2022.3.62f1; Editor scripts, test assembly, Play Mode, standalone builds |
| Bàn giao ZIP | Thêm script xuất save bên trong project; kiểm tra ZIP khớp toàn bộ file nguồn sau đóng gói | Đây vẫn là ZIP source, chưa phải player chạy được |

## Lỗi tìm thấy và sửa

1. **Inventory/ledger/profile thiếu trường vẫn được deserialize bằng giá trị mặc định.** Tái hiện trên Core lấy từ ZIP cũ: import `{"truc-khe.inventory.v1":{}}` được chấp nhận và xóa bộ đồ hiện có. Đã đánh dấu trường bắt buộc; save/import thiếu trường bị từ chối trước khi ghi. Native save thiếu vị trí cũng bị từ chối thay vì mặc định lại spawn.
2. **Số lượng JSON thập phân bị làm tròn.** Tái hiện ZIP cũ: legacy herb `1.5` trở thành `2`. Parser save mới chỉ nhận JSON integer cho trường số nguyên; từ chối cả số dạng chuỗi và legacy bag sai cấu trúc. Bộ test xác nhận file/memory giữ nguyên khi import lỗi.
3. **Hướng nhân vật ngoài 0–3 lọt qua validation.** ZIP cũ chấp nhận `direction=4`, dẫn tới chỉ số frame ngoài atlas trong renderer. Đã kiểm tra direction ở native progress và return point.
4. **Mesh cây dùng sai không gian tọa độ.** `Sprite.OverrideGeometry` nhận pixel từ `(0,0)` tới `rect.size`, tự trừ pivot và chia pixels-per-unit; bản đầu đã chia 100 và trừ pivot trước. Sửa vertex về pixel theo [API Unity 2022.3](https://docs.unity3d.com/2022.3/Documentation/ScriptReference/Sprite.OverrideGeometry.html). Thêm test Play Mode kiểm tra bounds/pivot/UV; **test này chưa chạy**, hình cây chưa được duyệt lại.
5. **Rời world dù lưu thất bại.** `BackToCreator` trước đây bỏ qua kết quả `PersistWorld`. Đã giữ world khi ghi thất bại để retry; không cho đường này bỏ qua combat. Test tích hợp mới **chưa chạy**.
6. **Đổi locale làm mất hero đang chọn ở creator.** Giữ cả draft hero và tên khi dựng lại UI. Test tích hợp mới **chưa chạy**.
7. **Import không dùng thư mục của SaveStore đang mở.** Đổi sang `Saves.DirectoryPath`, cùng đường dẫn UI hướng dẫn và thư mục cách ly khi test. Ngăn gọi import giữa combat. Test tích hợp mới **chưa chạy**.
8. **ZIP thiếu script xuất save mà README chỉ đến.** Đưa `Tools/export-web-save.js` vào project/ZIP, sửa hướng dẫn, exporter và validator kiểm tra bản sao khớp nguồn. Ba test Node của script pass.

Các sửa adapter/mesh mới được rà mã và biên dịch bổ sung; không đổi nhãn thành “Unity pass” dựa vào các bước đó.

## Các lệnh đã chạy và kết quả

Chạy tại gốc repo; `dotnet` trong phiên này là `/tmp/truckhe-dotnet/dotnet`, SDK 8.0.426.

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `dotnet run --project unity/Validation/Validation.csproj -- unity` | **87 PASS**: 72 cũ + 15 ca audit; không phải Unity tests |
| `node --test unity/Validation/export-save.test.mjs` | **3 PASS**: đủ 6 key, bỏ key không liên quan/vắng mặt, chặn JSON hỏng trước download |
| `python3 tools/unity-project.py --check` | **PASS**: 89 hash nguồn, 61 PNG, rect, 103 GUID, references, literal locales, font/audio, portable exporter |
| `node tools/export-unity.mjs` và so SHA-256 trước/sau | **PASS**: 68 file dữ liệu/art/font/fixture kiểm tra không đổi; 4 map, 4 quái, 23 item, 14 baked layers |
| .NET compile Core + Runtime | **PASS, 0 warning/0 error** với UnityEngine.Modules **2021.3.33**, UnityEngine.UI **2018.3.5.1**; không phải Unity 2022 import/compile |
| Trong `game`: `npm run test`, `npm run check:assets`, `npm run build` | **74 PASS**, 77 asset/0 pending review, TypeScript/Vite build PASS |
| Web Playwright | Không chạy lại: runtime web không thay đổi; không dùng test web để kết luận Unity UI |
| Unity Editor / 9 test Play Mode / player build | **CHƯA CHẠY**: chưa có executable Unity trong môi trường; chưa xác nhận package import, shader, Editor/test assembly |

Log core: [`Validation/last-run.txt`](Validation/last-run.txt). Script xuất save: [`Validation/export-save-last-run.txt`](Validation/export-save-last-run.txt). Cấu trúc: [`Validation/structure-last-run.txt`](Validation/structure-last-run.txt).

Bộ Play Mode có 9 bài: creator/inventory/locale; encounter/pause/return; 4 map × 4 hero; geometry cây; draft creator qua locale; giữ world khi lưu lỗi; import đúng thư mục/tiến trình; retry lưu kết quả chỉ tiêu một lượt; mất focus xóa input và giữ pause. Có test trong source không chứng minh test đã compile hoặc pass.

## Điểm chặn nghiệm thu còn lại

Mở project bằng **Unity 2022.3.62f1**, chạy Validate Project, chạy Test Runner, kiểm tra ảnh/input/resize/audio thực tế rồi build player. Cần ghi log và ảnh thật trước khi xác nhận từng ô còn thiếu. Chưa tạo Windows/Linux/macOS executable, chưa đo FPS/heap Unity, chưa thử mobile/WebGL.

Các tính năng nguồn chưa có vẫn chưa có: XP/loot, progression tu luyện, chọn hệ, cloud save, ngoại hình theo trang bị; quái núi vẫn là hội thoại. Bản chuyển giữ 2D trong Unity, không có mô hình 3D mới.
