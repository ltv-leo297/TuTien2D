# Chuyển sang Unity 6.3 LTS

Project hiện nhắm **Unity 6.3 LTS, 6000.3.26f1**, revision **de8167e7440c**. Phiên bản và revision được ghim trong `ProjectSettings/ProjectVersion.txt`. Bản 2022.3 trước đó nằm trong lịch sử Git; dùng thư mục `unity/` hiện tại để mở bằng Unity 6.

## Thay đổi

- uGUI **2.0.0**, Test Framework **1.6.0** theo dòng core package của Unity 6.3; giữ Newtonsoft JSON **3.2.1** và bảo toàn model/save/AOT helpers.
- Khai báo module **inputlegacy 1.0.0** để `UnityEngine.Input` và `StandaloneInputModule` hoạt động. `Active Input Handling` vẫn là **Input Manager (Old)**; cả chuột, bàn phím và multi-touch hiện có dùng đường input này.
- Editor build dùng **NamedBuildTarget** cho bundle ID, backend IL2CPP, .NET Standard, stripping và kiến trúc iOS. Preview và Play Mode tests dùng `FindFirstObjectByType` / `FindObjectsByType`, không dùng các API tìm object đã obsolete.
- Validate Project và build kiểm tra Editor thuộc dòng **6000.3**, legacy input được bật và renderer đang dùng **Built-in**. Unity 6 vẫn hỗ trợ renderer này, phù hợp với `PixelSprite.shader`, sprite, font và asset đã có. Không cần chuyển shader sang URP để nâng cấp Editor.
- Launcher Android/iOS đọc phiên bản yêu cầu trực tiếp từ `ProjectVersion.txt`; `--help` và `--dry-run` thể hiện đúng phiên bản. Menu build APK/AAB/Xcode, landscape/safe area và UI mobile A tiếp tục dùng cấu hình đã có.
- Kiểm tra cấu trúc xác nhận version/revision, phiên bản package, module input, renderer và GUID. Giữ nguyên asset production, dữ liệu game và GUID hiện có.

## Mở và build

1. Cài **6000.3.26f1** bằng Unity Hub, thêm Android Build Support (SDK/NDK/OpenJDK đi kèm) và iOS Build Support nếu cần. Mở thư mục `unity/`, chờ Package Manager resolve/import. Không chọn một template URP mới rồi chép Assets vào.
2. Unity sẽ nâng cấp/re-serialize các settings/scene khi import lần đầu. Source settings hiện được giữ ở định dạng YAML đọc được của bản port; chưa có lần re-serialize bằng Editor trong cloud. Không tạo tay `packages-lock.json` hoặc dữ liệu `Library`; để Package Manager tạo từ phiên bản Editor thực tế.
3. Mở `Assets/TrucKhe/Scenes/Main.unity`, chạy **Truc Khe → Validate Project**. Kiểm tra **Player → Active Input Handling = Input Manager (Old)**, Graphics/Quality không gán render pipeline asset. Nếu đổi input handling, restart Editor.
4. Bật **Truc Khe → Mobile → Preview Phone UI in Editor**, Play và thử Game view landscape. Chạy toàn bộ **19 Play Mode tests** trong Test Runner. Các test đã cập nhật API Unity 6 nhưng chưa được chạy/compile bằng Editor ở môi trường này.
5. **File → Build Profiles → Platforms → Android/iOS → Switch Platform**, áp dụng **Truc Khe → Mobile → Apply Android and iOS Settings**, rồi dùng menu build tương ứng. Dùng cấu hình platform mặc định; nếu tạo custom Build Profile, kiểm tra Player Settings overrides của profile trước khi build. Scene Main đã có trong shared scene list; menu build cũng truyền scene này trực tiếp.
6. Với Android dùng SDK/NDK/JDK đi kèm đúng Editor, không tái sử dụng toolchain của 2022.3. iOS cần macOS/Xcode và signing để chạy/archive. Chi tiết ở [MOBILE.md](MOBILE.md).

```sh
# Chạy từ thư mục unity; thay đường dẫn executable trên máy.
python3 Tools/build-mobile.py android-apk --unity /path/to/6000.3.26f1/Unity
python3 Tools/build-mobile.py android-aab --unity /path/to/6000.3.26f1/Unity
python3 Tools/build-mobile.py ios --unity /Applications/Unity/Hub/Editor/6000.3.26f1/Unity.app/Contents/MacOS/Unity
```

## Phạm vi kiểm tra

| Kiểm tra | Kết quả / giới hạn |
|---|---|
| Core C# / .NET 8 | **101 PASS**; `Validation/last-run.txt` |
| Python mobile launcher | **5 PASS**; `Validation/mobile-build-last-run.txt`; subprocess được mock, không build player |
| Cấu trúc, cấu hình Unity 6, asset và GUID | **PASS**; `Validation/structure-last-run.txt` |
| Compiler dùng reference Unity 2021/UGUI 2018 ở đợt trước | Bằng chứng lịch sử; không kiểm chứng API Editor/test mới hoặc Unity 6 |
| Unity 6 package resolve, C#/shader compile, 19 Play Mode tests | **CHƯA CHẠY**; môi trường chưa có Unity Editor/license |
| Android APK/AAB, iOS Xcode/IPA và render/input trên điện thoại | **CHƯA CHẠY** |

Đã chuyển cấu hình/source sang Unity 6; chưa xác nhận import/build thành công bằng Editor. Lần nghiệm thu tiếp theo cần lưu log import, kết quả Test Runner, ảnh creator/làng/rừng/hành trang/combat và log build Android/iOS thật. Không dùng kết quả core hoặc ảnh mockup làm bằng chứng native.

## Nguồn đối chiếu

- [Unity 6000.3.26f1 — release và revision](https://unity.com/releases/editor/whats-new/6000.3.26f1)
- [Unity 6.3 uGUI core package](https://docs.unity3d.com/6000.3/Documentation/Manual/com.unity.ugui.html), [package.json từ nhánh uGUI 6000.3 chính thức](https://github.com/Unity-Technologies/uGUI/blob/6000.3/com.unity.ugui/package.json)
- [Unity 6.3 Test Framework core package](https://docs.unity3d.com/6000.3/Documentation/Manual/com.unity.test-framework.html), [Test Framework 1.6.0](https://docs.unity3d.com/Packages/com.unity.test-framework@1.6/manual/index.html)
- [API PlayerSettings từ nhánh UnityCsReference 6000.3](https://github.com/Unity-Technologies/UnityCsReference/blob/6000.3/Editor/Mono/PlayerSettings.bindings.cs)
- [Hướng dẫn nâng cấp Unity 6](https://docs.unity3d.com/6000.3/Documentation/Manual/UpgradeGuideUnity6.html)
