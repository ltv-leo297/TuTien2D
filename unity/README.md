# Trúc Khê — Unity

Bản chuyển runtime TuTien2D sang **Unity 2022.3 LTS, C# và Built-in Render Pipeline**. Mở thư mục `unity/` bằng Unity Hub; không mở thư mục gốc repo như một project Unity.

Giữ art Bright Handheld 2D: khám phá top-down, chiến đấu nhìn ngang. Không có mô hình nhân vật/môi trường 3D mới. Game chạy bằng C#, SpriteRenderer và Unity UI, không nhúng bản web hay phụ thuộc Node tại runtime.

**Trạng thái:** nguồn, dữ liệu, asset và harness đã được chuyển. Kiểm tra logic C# và cấu trúc project đã chạy; Unity Editor/Play Mode/player build chưa chạy trong cloud này. Đợt rà soát mới nhất ở [`AUDIT.md`](AUDIT.md). Xem `MIGRATION.md` để phân biệt kết quả đã kiểm tra với bước còn cần nghiệm thu.

## Mở và chơi

1. Unity Hub → **Add project from disk** → chọn thư mục `unity`.
2. Dùng **2022.3.62f1** (bản khai báo của project). Chờ Package Manager tải Unity UI, Newtonsoft JSON và Test Framework.
3. Mở `Assets/TrucKhe/Scenes/Main.unity` hoặc menu **Truc Khe → Open Main Scene**.
4. Bấm **Play**. Chọn một trong bốn nhân vật, nhập tên và vào làng.

Scene Main chứa `GameRoot`. Các đối tượng map, camera, UI và combat được tạo thành GameObject lúc Play từ catalog đã xuất; có thể xem chúng trong Hierarchy. Đây không phải một scene đầy đủ vật thể được bố trí thủ công trong Edit Mode.

- Khám phá: bấm đất để tìm đường; bấm NPC/tài nguyên/quái để tiếp cận; bấm biển chỉ đường hoặc minimap để đi.
- Chiến đấu: A/D hoặc ←/→, Space nhảy đôi, J đánh, giữ K đỡ, Shift lướt, L kỹ năng, Esc tạm dừng. Có nút giữ trên màn hình.
- Hành trang: thuộc tính, 10 slot trang bị, túi 100 ô, tìm/lọc, so sánh và đeo/tháo. Vật phẩm dùng icon PNG đã có.
- Tùy chọn: Việt/Anh, giảm chuyển động, âm thanh môi trường, nhập save và đổi nhân vật.

## Build và kiểm tra trong Unity

- **Truc Khe → Validate Project** kiểm tra dữ liệu, điểm spawn, cổng và khả năng nạp asset trong Editor.
- **Window → General → Test Runner → PlayMode → Run All** chạy 19 bài kiểm tra tích hợp (chưa chạy trong cloud). Test dùng thư mục save riêng trong `temporaryCachePath`.
- **Truc Khe → Build → Windows x64 / Linux x64 / macOS** build vào `Builds/`. Unity cần có module build tương ứng. Chưa tạo file player trong lần chuyển này.

Ví dụ batch mode, thay đường dẫn Unity và project theo máy:

```sh
Unity -batchmode -projectPath /path/to/TuTien2D/unity \
  -executeMethod TrucKhe.Editor.ProjectTools.Validate -quit -logFile validate.log

Unity -batchmode -projectPath /path/to/TuTien2D/unity \
  -runTests -testPlatform PlayMode -testResults TestResults/playmode.xml -logFile playmode.log

Unity -batchmode -projectPath /path/to/TuTien2D/unity \
  -executeMethod TrucKhe.Editor.ProjectTools.Windows -quit -logFile build.log
```

Play Mode cần môi trường hỗ trợ rendering. Đã thêm **Android APK/AAB và iOS Xcode**, cảm ứng nhiều ngón, safe area và lưu/pause khi xuống nền. Xem [`MOBILE.md`](MOBILE.md) để cài module, ký và build. Mobile/WebGL chưa được nghiệm thu trên thiết bị.

UI điện thoại **A — Hai ngón cái** đã được triển khai trong source: HUD gọn, cụm nút tròn và hành trang chia tab. Bật **Truc Khe → Mobile → Preview Phone UI in Editor** để xem layout trong Editor. Xem [`MOBILE-UI.md`](MOBILE-UI.md) cho phạm vi, 101 core checks và các bước native còn chưa chạy.

## Lưu game và chuyển save web

Unity lưu `progress-v1.json` tại `Application.persistentDataPath`. Menu **Truc Khe → Open Save Folder** mở đúng thư mục trên máy. File `.bak` giữ bản trước lần ghi thành công; `.lock` ngăn hai instance cùng ghi một save. Nếu save hỏng, game báo lỗi và giữ file để phục hồi, không tự reset.

Save của trình duyệt không thể tự đọc từ ứng dụng desktop. Để chuyển:

1. Mở bản web cũ tại đúng origin đang có save, dừng trận đang chơi.
2. Chạy nội dung `Tools/export-web-save.js` trong DevTools Console. Script tải `web-save.json` chỉ chứa các khóa lưu của game này.
3. Đặt file vào thư mục save Unity, mở **Tùy chọn → Nhập bản lưu web** và xác nhận nhập. Lần nhập hợp lệ thay tiến trình Unity bằng dữ liệu web; bản Unity trước đó nằm trong `.bak`.

Import hỗ trợ inventory mới hoặc túi resource cũ, trang bị, phần dư, NPC đã gặp, hồ sơ, ngôn ngữ, giảm chuyển động và ledger lượt. Trận bị bỏ dở được kết thúc một lần khi khôi phục. Hồi lượt theo timestamp riêng từng lượt; UI chỉ hiện số lượt ở thẻ quái ngoài map.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `Assets/TrucKhe/Core` | Luật chơi C# độc lập Unity: navigation, world, combat, AI, inventory, ledger và lưu file |
| `Assets/TrucKhe/Runtime` | Bootstrap, camera, SpriteRenderer, môi trường, combat, Unity UI và input |
| `Assets/TrucKhe/Resources/Data/content.json` | Bốn scene, actor/collider/cổng, catalog, chỉ số, locale, metadata sprite |
| `Assets/TrucKhe/Resources/Art/Production` | Bản sao nguyên byte của toàn bộ asset production đang dùng ở web |
| `Assets/TrucKhe/Resources/Art/Baked` | Nền/minimap từ renderer gốc, lớp nước và cutout theo mask đã đo |
| `Assets/TrucKhe/Resources/Fonts` | Noto Sans có dấu tiếng Việt và thông tin giấy phép |
| `Assets/TrucKhe/Editor` | Cấu hình import pixel art, validate và build |
| `Assets/TrucKhe/Tests/PlayMode` | Harness tích hợp chờ chạy bằng Unity |
| `Validation` | Kiểm thử core bằng .NET 8 và fixture từ TypeScript gốc |

Sau khi chuyển, có thể sửa catalog JSON trong Unity. Công cụ export là thao tác chủ động và sẽ ghi lại dữ liệu/asset sinh ra từ web; không chạy lại nếu muốn giữ các sửa đổi riêng ở JSON Unity mà chưa đồng bộ về nguồn.

## Xuất lại từ repo nguồn

Từ thư mục gốc TuTien2D, sau `npm ci` trong `game/`:

```sh
node tools/export-unity.mjs
python3 tools/unity-project.py --sync-meta --check
dotnet run --project unity/Validation/Validation.csproj -- unity
node --test unity/Validation/export-save.test.mjs
```

Exporter dùng Chromium có sẵn tại `/usr/bin/chromium`; có thể đặt `CHROMIUM_PATH` để chọn executable khác. Vite chỉ chạy cục bộ trong lúc export và được dừng sau đó. Artifact Unity đã chứa dữ liệu và asset, nên không cần chạy exporter để mở/chơi trong Unity.

`Validation.csproj` dùng .NET 8 SDK và Newtonsoft đi kèm SDK, không tải package NuGet cho bộ test core. Runtime Unity dùng package Newtonsoft chính thức của Unity. Thư mục `Library`, `Temp`, `Builds` và `Validation/bin/obj` không thuộc source bàn giao.
