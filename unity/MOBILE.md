# Build Android và iOS

**Cập nhật UI A:** source đã có HUD, combat và hành trang thiết kế riêng cho điện thoại. Hướng dẫn preview, 101 core checks/19 Play Mode tests và giới hạn nghiệm thu hiện tại ở [`MOBILE-UI.md`](MOBILE-UI.md). Số kiểm tra bên dưới ghi lại đợt bổ sung build trước đó.

Đã thêm cấu hình, menu build và input mobile vào source. **Chưa tạo hoặc chạy APK/AAB/IPA trong cloud:** môi trường không có Unity Editor, Android toolchain hoặc Xcode. Kết quả kiểm tra ngoài Unity ở cuối tài liệu này.

## Cấu hình mặc định

| | Android | iOS |
|---|---|---|
| Đầu ra | APK development; AAB release | Project Xcode để ký/build trên Mac |
| CPU/backend | ARM64, IL2CPP | ARM64, IL2CPP |
| Hệ điều hành tối thiểu | Android 8 / API 26 | iOS 15, iPhone và iPad |
| Graphics | OpenGL ES 3 | Metal |
| Màn hình | Nằm ngang, xoay hai chiều, UI theo safe area | Nằm ngang, xoay hai chiều, UI theo safe area |

Bundle ID ban đầu là `com.tutien2d.truckhe`. Đổi thành ID của ứng dụng trước khi phát hành. Menu cấu hình giữ ID không rỗng và thông tin ký đã thiết lập. Android target API chọn bản cao nhất đã cài; đây không phải cam kết đáp ứng yêu cầu Google Play hiện hành. Khi phát hành, kiểm tra yêu cầu target API, hỗ trợ page size 16 KB, Xcode/iOS SDK và dùng bản Unity được vá tương thích. Project đang khai báo **2022.3.62f1**; chưa nghiệm thu trên store.

## Android

1. Unity Hub → Installs → Unity 2022.3.62f1 → Add modules → **Android Build Support**, gồm **Android SDK & NDK Tools** và **OpenJDK**. Dùng các công cụ đi kèm đúng bản Editor.
2. Mở project, đợi import; chọn **Truc Khe → Mobile → Apply Android and iOS Settings**.
3. **File → Build Settings → Android → Switch Platform**. Chạy **Truc Khe → Validate Project**.
4. **Truc Khe → Build → Android APK (Development)** tạo `Builds/Android/TrucKhe-dev.apk`. APK dùng cấu hình ký hiện có, mặc định là debug keystore khi chưa bật Custom Keystore.
5. Bật USB debugging trên điện thoại ARM64, kết nối máy và cài bằng `adb install -r Builds/Android/TrucKhe-dev.apk`, hoặc dùng Build And Run trong Unity.

Để xuất AAB: vào **Player Settings → Android → Publishing Settings**, thiết lập upload keystore, alias và mật khẩu trên máy build; tăng Bundle Version Code cho mỗi bản phát hành, rồi chọn **Truc Khe → Build → Android AAB (Release)**. Kết quả ở `Builds/Android/TrucKhe.aab`. Build sẽ từ chối AAB khi chưa chọn custom keystore/alias. AAB không cài trực tiếp bằng `adb install`; dùng Play internal testing hoặc bundletool. Không commit keystore, mật khẩu hay chứng chỉ vào repo.

## iOS

1. Dùng **macOS**, Unity Hub với **iOS Build Support**, và Xcode tương thích. Mở project, áp dụng cấu hình mobile.
2. **File → Build Settings → iOS → Switch Platform**, sau đó **Truc Khe → Build → iOS Xcode Project**.
3. Mở `Builds/iOS/Unity-iPhone.xcodeproj` bằng Xcode. Ở target **Unity-iPhone → Signing & Capabilities**, chọn Apple Development Team và Bundle Identifier phù hợp; bật Automatically manage signing nếu dùng quy trình ký tự động.
4. Chọn iPhone/iPad thật để Run. Để phân phối: chọn thiết bị iOS chung, **Product → Archive → Distribute App** và chọn phương thức xuất/upload phù hợp tài khoản Apple.

Project Xcode chưa phải IPA. Cấu hình hiện tại dùng Device SDK ARM64, chưa cấu hình iOS Simulator. Apple Developer signing/provisioning được thiết lập trên máy của người phát triển; không chứa trong ZIP source.

## Build bằng dòng lệnh

Python 3 chỉ dùng để gọi Editor; player không phụ thuộc Python. Chạy từ thư mục `unity`, thay đường dẫn executable theo máy. Đóng Editor đang mở cùng project trước khi chạy batch build.

```sh
python3 Tools/build-mobile.py android-apk --unity /path/to/Unity
python3 Tools/build-mobile.py android-aab --unity /path/to/Unity
python3 Tools/build-mobile.py ios --unity /Applications/Unity/Hub/Editor/2022.3.62f1/Unity.app/Contents/MacOS/Unity
```

Windows dùng `python` và đường dẫn `Unity.exe` trong dấu ngoặc kép. Có thể đặt biến `UNITY_EDITOR` thay cho `--unity`. `--output` chọn file APK/AAB hoặc thư mục Xcode; đường dẫn tương đối tính từ project Unity. Log mặc định ở `Logs/<target>.log`; `--log` nhận đường dẫn tùy chọn, tính từ thư mục gọi lệnh. `--dry-run` chỉ in tham số, không build. Script trả lỗi nếu Unity thất bại hoặc không có artifact mong đợi.

Ví dụ gọi trực tiếp:

```sh
Unity -batchmode -quit -projectPath /path/to/TuTien2D/unity \
  -buildTarget Android -executeMethod TrucKhe.Editor.MobileBuilds.AndroidApk \
  -trucKheBuildPath /path/to/output/TrucKhe.apk -logFile /path/to/android.log
```

CI cần Editor đã được kích hoạt, module build phù hợp và cơ chế cấp thông tin ký. Không có workflow CI giả định tài khoản/license trong bản bàn giao này.

## Thay đổi khi chơi trên điện thoại

- Chạm để đi/tương tác trên map; raycast UI chặn chạm xuyên xuống map. Combat hỗ trợ giữ nhiều nút đồng thời và nút lớn hơn; ẩn gợi ý phím desktop.
- UI 1280×720 được co đồng đều, đặt trong vùng an toàn của màn hình; giữ bố cục/art đã duyệt. Safe area thay đổi theo xoay màn hình được cập nhật trong runtime.
- Khi mất focus/đưa xuống nền, game bỏ các ngón đang giữ, dừng đi, lưu tiến trình map và pause combat. Khi quay lại, trận chờ người chơi bấm tiếp tục. Save dùng `Application.persistentDataPath`, không yêu cầu quyền đọc bộ nhớ ngoài.
- InputField dùng bàn phím hệ thống. Ẩn nút nhập save web bằng đường dẫn desktop trên mobile và nút thoát ứng dụng trên iOS.
- Giữ model JSON và các generic collection cần thiết cho IL2CPP qua `link.xml` và `JsonAot`. Cần xác nhận deserialize/save thực tế trong player IL2CPP.

## Kết quả và bước nghiệm thu

Ngày 2026-10-18:

- **94 kiểm tra core C# pass**, gồm 7 ca mới kiểm tra phép fit safe area, giới hạn hiển thị và đổi tọa độ. Log: `Validation/last-run.txt`.
- **5 kiểm tra Python launcher pass**: tham số ba target/đường dẫn có khoảng trắng, đầu ra không hợp lệ, dry run, Unity exit lỗi và thiếu artifact. Đây là kiểm tra bằng mock subprocess, không chạy Unity. Log: `Validation/mobile-build-last-run.txt`.
- Kiểm tra cấu trúc: 89 hash nguồn, 61 PNG, 107 GUID, references, locale và tài nguyên hợp lệ. Log: `Validation/structure-last-run.txt`.
- Biên dịch bổ sung Core + Runtime bằng .NET 8: **0 warning, 0 error**, dùng UnityEngine.Modules 2021.3.33, UnityEngine.UI 2018.3.5.1 và Newtonsoft AOT DLL từ package Unity 3.2.1. Log: `Validation/mobile-compile-last-run.txt`. Reference/toolchain đặt ngoài repo; bước này không compile Editor/test assembly, shader hoặc chạy IL2CPP bằng Unity 2022.3.
- Có **13 bài Unity Play Mode**, gồm 4 bài mới về nhiều ngón, raycast, safe area và pause/focus; **chưa chạy**.

Trước khi gọi là bản mobile đã nghiệm thu: import/compile bằng đúng Editor; chạy Validate Project và 13 test Play Mode; build APK và Xcode; chạy trên điện thoại thật. Kiểm tra tạo nhân vật/bàn phím, bốn map, hành trang/scroll, nhiều ngón trong combat, xoay trái/phải trên màn hình có cutout, Home/lock rồi mở lại, đóng/mở app giữ save, và khôi phục trận dang dở. Đo FPS, bộ nhớ và nhiệt trên thiết bị mục tiêu. Chưa có log build, ảnh render Unity hay số đo hiệu năng mobile trong môi trường này.
